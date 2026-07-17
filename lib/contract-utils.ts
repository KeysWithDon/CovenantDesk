import type { ContractData, CustomClause, ScheduleEntry } from "./contract-types";
import { REQUIRED_CLAUSES } from "./legal-clauses";

export function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value: string) {
  if (!value) return "Not specified";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

export function formatTime(value: string) {
  if (!value) return "—";
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes || 0).padStart(2, "0")} ${suffix}`;
}

export function hoursBetween(start: string, end: string) {
  if (!start || !end) return 0;
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return Math.max(0, (endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60);
}

function timeMinutes(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return Number.NaN;
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function weeksBetween(start: string, end: string) {
  const a = new Date(`${start}T12:00:00`).getTime();
  const b = new Date(`${end}T12:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return Math.floor((b - a) / 604800000) + 1;
}

export function occurrenceCount(entry: ScheduleEntry) {
  const weeks = weeksBetween(entry.firstOccurrence, entry.lastOccurrence);
  if (!weeks) return 0;
  if (entry.recurrence === "Every week") return weeks;
  if (entry.recurrence === "Every other week") return Math.ceil(weeks / 2);
  if (entry.recurrence === "Selected dates only") return 1;
  if (entry.recurrence === "Custom recurrence") return Math.max(1, Math.ceil(weeks / 4));
  return Math.max(1, Math.ceil(weeks / 4.345));
}

export function calculateSchedule(schedule: ScheduleEntry[], overtimeRate = 0) {
  return schedule.reduce(
    (totals, entry) => {
      const occurrences = occurrenceCount(entry);
      const rentalHours = hoursBetween(entry.rentalStart, entry.rentalEnd);
      const setupHours = hoursBetween(entry.setupStart, entry.rentalStart);
      const cleanupHours = hoursBetween(entry.rentalEnd, entry.cleanupEnd);
      const overtimeHours = Math.max(0, rentalHours - 8) * occurrences;
      totals.occurrences += occurrences;
      totals.rentalHours += rentalHours * occurrences;
      totals.setupHours += setupHours * occurrences;
      totals.cleanupHours += cleanupHours * occurrences;
      totals.overtimeCharges += overtimeHours * overtimeRate;
      totals.additionalCharges += entry.additionalCharge * occurrences;
      return totals;
    },
    { occurrences: 0, rentalHours: 0, setupHours: 0, cleanupHours: 0, overtimeCharges: 0, additionalCharges: 0 },
  );
}

function monthsInclusive(start: string, end: string) {
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0;
  return Math.max(1, (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth() + 1);
}

export function calculatePayment(contract: ContractData) {
  const schedule = calculateSchedule(contract.schedule, contract.payment.overtimeRate);
  const method = contract.payment.calculationMethod;
  let baseRent = contract.payment.rentalPrice;
  if (method === "hour") baseRent = schedule.rentalHours * contract.payment.hourlyRate;
  if (method === "day" || method === "occurrence") baseRent = schedule.occurrences * (method === "day" ? contract.payment.dailyRate : contract.payment.pricePerOccurrence);
  if (method === "week") baseRent = Math.ceil(schedule.occurrences / Math.max(1, contract.schedule.length)) * contract.payment.weeklyRate;
  if (method === "month") baseRent = monthsInclusive(contract.term.startDate, contract.term.endDate) * contract.payment.monthlyRate;
  if (method === "flat") baseRent = contract.payment.flatAmount;
  const recurringMultiplier = method === "month" ? monthsInclusive(contract.term.startDate, contract.term.endDate) : 1;
  const recurringFees = contract.payment.recurringFees.reduce((sum, fee) => sum + fee.amount, 0) * recurringMultiplier;
  const oneTimeFees = contract.payment.oneTimeFees.reduce((sum, fee) => sum + fee.amount, 0);
  const estimatedTotal = baseRent + recurringFees + oneTimeFees + contract.payment.taxes + schedule.overtimeCharges + schedule.additionalCharges;
  const firstAmountDue = (method === "month" ? contract.payment.monthlyRate : contract.payment.rentalPrice) + contract.securityDeposit.amount + contract.payment.oneTimeFees.reduce((sum, fee) => sum + fee.amount, 0);
  return { ...schedule, baseRent, recurringFees, oneTimeFees, estimatedTotal, firstAmountDue };
}

export function agreementTitle(contract: ContractData) {
  if (contract.metadata.agreementType === "Custom commercial rental agreement" && contract.metadata.customTitle.trim()) return contract.metadata.customTitle.trim();
  return contract.metadata.agreementType.toUpperCase();
}

export function rentalPatternLabel(pattern: ContractData["term"]["rentalPattern"]) {
  return ({
    "one-day": "One-day rental",
    "recurring-weekly": "Recurring weekly rental",
    "multi-day": "Multi-day rental",
    custom: "Custom schedule",
  } as const)[pattern];
}

export function formatDateList(values: string[]) {
  return values.length ? values.map(formatDate).join(", ") : "None";
}

export function requiredClauseFingerprint() {
  return REQUIRED_CLAUSES.map((item) => `${item.number}:${item.key}:${item.text}`).join("|");
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}

export async function hashContract(contract: ContractData) {
  const clone = JSON.parse(JSON.stringify(contract)) as ContractData;
  clone.audit = [];
  clone.versions = [];
  const bytes = new TextEncoder().encode(`${stableStringify(clone)}|${requiredClauseFingerprint()}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function contractCompletion(contract: ContractData) {
  const checks = [
    contract.property.address.street,
    contract.property.rentedAreas.length || contract.property.customArea,
    contract.lessor.legalName,
    contract.lessor.responsible.fullName,
    contract.lessor.responsible.hasAuthority,
    contract.renter.legalName,
    contract.renter.responsible.fullName,
    contract.renter.responsible.hasAuthority,
    contract.term.startDate,
    contract.term.endDate,
    contract.term.rentalPattern,
    contract.term.rentalPattern === "one-day" ? !contract.term.threeMonthCommitmentEnabled : contract.term.noticePeriodDays >= 0,
    contract.schedule.length > 0,
    contract.schedule.every((entry) => entry.rentalStart && entry.rentalEnd),
    contract.payment.rentalPrice >= 0,
    contract.payment.frequency,
    contract.securityDeposit.amount >= 0 && (contract.securityDeposit.amount === 0 || Boolean(contract.securityDeposit.dueDate)),
    contract.notices.lessorAddress && contract.notices.renterAddress,
    contract.signatureMethod,
    contract.metadata.attorneyNoticeAccepted,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function validateContractData(contract: ContractData) {
  const errors: string[] = [];
  if (!contract.property.address.street) errors.push("Property street address is required.");
  if (!contract.property.rentedAreas.length && !contract.property.customArea) errors.push("At least one rented area is required.");
  if (!contract.lessor.legalName || !contract.lessor.responsible.fullName) errors.push("Property Owner/Lessor names are required.");
  if (!contract.renter.legalName || !contract.renter.responsible.fullName) errors.push("Renter names are required.");
  if (!contract.lessor.responsible.hasAuthority || !contract.renter.responsible.hasAuthority) errors.push("Both responsible parties must confirm signing authority.");
  if (!contract.schedule.length) errors.push("At least one rental day is required.");
  const start = new Date(`${contract.term.startDate}T00:00:00`).getTime();
  const end = new Date(`${contract.term.endDate}T00:00:00`).getTime();
  if (!start || !end || end < start) errors.push("The contract date range is invalid.");
  if (contract.term.rentalPattern === "one-day" && contract.term.threeMonthCommitmentEnabled) errors.push("A one-day rental cannot use the initial three-month commitment.");
  if (contract.term.rentalPattern === "one-day" && start !== end) errors.push("A one-day rental must start and end on the same date.");
  if (start && end && contract.term.rentalPattern !== "one-day" && contract.term.threeMonthCommitmentEnabled) {
    const minimumEnd = new Date(`${contract.term.startDate}T00:00:00`);
    minimumEnd.setMonth(minimumEnd.getMonth() + 3);
    if (end < minimumEnd.getTime()) errors.push("The contract term must cover the selected initial three-month commitment.");
  }
  if (contract.term.noticePeriodDays < 0) errors.push("The termination notice period cannot be negative.");
  const unavailable = new Set(contract.term.unavailableDates);
  if (contract.term.specialEventDates.some((date) => unavailable.has(date))) errors.push("A date cannot be both a special event and unavailable.");
  for (const entry of contract.schedule) {
    if (!entry.rentalStart || !entry.rentalEnd) errors.push(`${entry.day} needs rental start and ending times.`);
    if (timeMinutes(entry.rentalEnd) <= timeMinutes(entry.rentalStart)) errors.push(`${entry.day} ends before it starts.`);
    if (entry.setupStart && timeMinutes(entry.setupStart) > timeMinutes(entry.rentalStart)) errors.push(`${entry.day} setup starts after the rental begins.`);
    if (entry.cleanupEnd && timeMinutes(entry.cleanupEnd) < timeMinutes(entry.rentalEnd)) errors.push(`${entry.day} cleanup ends before the rental ends.`);
    const first = new Date(`${entry.firstOccurrence}T00:00:00`).getTime();
    const last = new Date(`${entry.lastOccurrence}T00:00:00`).getTime();
    if (first < start || last > end || last < first) errors.push(`${entry.day} occurrence dates must stay within the contract term.`);
  }
  const seen = new Set<string>();
  for (const entry of contract.schedule) {
    const key = `${entry.day}|${entry.firstOccurrence}|${entry.lastOccurrence}|${entry.rentalStart}|${entry.rentalEnd}`;
    if (seen.has(key)) errors.push(`Duplicate ${entry.day} schedule entries are not permitted.`);
    seen.add(key);
  }
  for (let index = 0; index < contract.schedule.length; index += 1) {
    for (let other = index + 1; other < contract.schedule.length; other += 1) {
      const first = contract.schedule[index];
      const second = contract.schedule[other];
      if (first.day !== second.day) continue;
      const dateRangesOverlap = first.firstOccurrence <= second.lastOccurrence && second.firstOccurrence <= first.lastOccurrence;
      const timesOverlap = timeMinutes(first.rentalStart) < timeMinutes(second.cleanupEnd) && timeMinutes(second.rentalStart) < timeMinutes(first.cleanupEnd);
      if (dateRangesOverlap && timesOverlap) errors.push(`${first.day} schedule entries overlap.`);
    }
  }
  if (contract.payment.rentalPrice < 0 || contract.securityDeposit.amount < 0) errors.push("Prices and deposits cannot be negative.");
  if (!contract.notices.lessorAddress || !contract.notices.renterAddress) errors.push("Written-notice addresses are required for both parties.");
  if (!contract.metadata.attorneyNoticeAccepted) errors.push("The contract preparer must acknowledge the legal-advice notice before finalizing.");
  return errors;
}

export function customClauseConflicts(text: string) {
  const normalized = text.toLowerCase();
  const patterns = [
    { test: /page\s*(?:two|2).{0,20}(?:not|does not).{0,20}(?:apply|incorporat)/, message: "This may conflict with mandatory incorporation of the legal terms." },
    { test: /electronic signature.{0,30}(?:invalid|lesser|subordinate)/, message: "This may conflict with the required signature-equivalency provision." },
    { test: /security deposit.{0,30}(?:final rent|last payment)/, message: "This may conflict with the required security-deposit treatment." },
  ];
  return patterns.filter((item) => item.test.test(normalized)).map((item) => item.message);
}

export function isPrintableCustomClause(clause: CustomClause, page?: CustomClause["page"]) {
  return Boolean(
    clause.included &&
    (!page || clause.page === page) &&
    clause.title.trim() &&
    clause.text.trim(),
  );
}

export function makeCustomClausesOptional(contract: ContractData): ContractData {
  return {
    ...contract,
    customClauses: contract.customClauses.map((clause) => ({ ...clause, required: false as const })),
  };
}

export function shortHash(hash: string) {
  return hash ? `${hash.slice(0, 12)}…${hash.slice(-8)}` : "Pending";
}
