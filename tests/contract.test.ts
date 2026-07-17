import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { createNewContract, emptyAcknowledgments, requiredAcknowledgmentLabels } from "../lib/contract-defaults";
import { calculatePayment, calculateSchedule, hashContract, isPrintableCustomClause, makeCustomClausesOptional, validateContractData } from "../lib/contract-utils";
import { agreementClauses, PAGE_ONE_INCORPORATION_NOTICE, REQUIRED_CLAUSES, SIGNATURE_EQUIVALENCY_TEXT, terminationSummary } from "../lib/legal-clauses";
import type { ContractData } from "../lib/contract-types";

function oneDayContract(): ContractData {
  const contract = createNewContract();
  contract.metadata.attorneyNoticeAccepted = true;
  contract.term.rentalPattern = "one-day";
  contract.term.startDate = "2026-08-02";
  contract.term.endDate = "2026-08-02";
  contract.term.threeMonthCommitmentEnabled = false;
  contract.term.specialEventDates = [];
  contract.term.unavailableDates = [];
  contract.schedule = [{ ...contract.schedule[0], id: "one-day", day: "Sunday", recurrence: "Selected dates only", firstOccurrence: "2026-08-02", lastOccurrence: "2026-08-02" }];
  return contract;
}

test("core clauses are immutable and the rental-specific clause is generated", () => {
  const contract = createNewContract();
  assert.equal(REQUIRED_CLAUSES.length, 18);
  assert.ok(Object.isFrozen(REQUIRED_CLAUSES));
  assert.ok(REQUIRED_CLAUSES.every(Object.isFrozen));
  assert.equal(agreementClauses(contract).length, 19);
  assert.match(SIGNATURE_EQUIVALENCY_TEXT, /same effect as a handwritten signature/i);
});

test("one-day agreements never receive initial-commitment language", () => {
  const contract = oneDayContract();
  const summary = terminationSummary(contract);
  const completeTerms = agreementClauses(contract).map((item) => `${item.title} ${item.text}`).join(" ");
  assert.match(summary.title, /one-day cancellation/i);
  assert.doesNotMatch(`${summary.text} ${completeTerms}`, /three[- ]month/i);
  assert.equal(validateContractData(contract).length, 0);
});

test("every one-day cancellation choice produces the selected policy", () => {
  const contract = oneDayContract();
  contract.cancellation.refundUntil = "2026-07-25";
  contract.cancellation.partialRefundPercent = 60;
  contract.cancellation.reservationPayment = 250;
  contract.cancellation.customPolicy = "Cancel in writing by noon.";
  const expectations = [
    ["fully-refundable", /fully refundable/i],
    ["partially-refundable", /60%/i],
    ["nonrefundable-reservation", /\$250\.00 reservation payment/i],
    ["custom", /Cancel in writing by noon/i],
  ] as const;
  for (const [policyType, expected] of expectations) {
    contract.cancellation.policyType = policyType;
    assert.match(terminationSummary(contract).text, expected);
  }
});

test("recurring rentals support enabled and disabled commitments", () => {
  const contract = createNewContract();
  contract.term.rentalPattern = "recurring-weekly";
  contract.term.threeMonthCommitmentEnabled = true;
  assert.match(terminationSummary(contract).text, /initial three-month commitment/i);
  assert.match(terminationSummary(contract).text, /15 days/i);
  contract.term.threeMonthCommitmentEnabled = false;
  contract.term.noticePeriodDays = 30;
  const disabled = terminationSummary(contract).text;
  assert.match(disabled, /30 days/i);
  assert.match(disabled, /may not be forfeited solely/i);
});

test("multi-day rentals also support enabled and disabled commitments", () => {
  const contract = createNewContract();
  contract.term.rentalPattern = "multi-day";
  contract.term.threeMonthCommitmentEnabled = true;
  assert.match(terminationSummary(contract).title, /three-month/i);
  contract.term.threeMonthCommitmentEnabled = false;
  assert.match(terminationSummary(contract).title, /termination notice/i);
});

test("a zero security deposit does not require a due date", () => {
  const contract = createNewContract();
  contract.metadata.attorneyNoticeAccepted = true;
  contract.securityDeposit.amount = 0;
  contract.securityDeposit.dueDate = "";
  assert.doesNotMatch(validateContractData(contract).join(" "), /deposit due|deposit.*required/i);
});

test("retired property questions are absent from the data model, schema, and form", async () => {
  const source = await Promise.all([
    "../lib/contract-types.ts",
    "../lib/contract-schema.ts",
    "../app/components/ContractForm.tsx",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  const combined = source.join("\n");
  assert.doesNotMatch(combined, /maximum.?occupancy|parking.?spaces|accessibility information/i);
});

test("page one incorporates page two and the default preview is two pages", async () => {
  assert.match(PAGE_ONE_INCORPORATION_NOTICE, /page two/i);
  assert.match(PAGE_ONE_INCORPORATION_NOTICE, /incorporated into page one/i);
  const preview = await readFile(new URL("../app/components/DocumentPreview.tsx", import.meta.url), "utf8");
  assert.match(preview, /const total = 2/);
  assert.match(preview, /LEGAL TERMS AND CONDITIONS — INCORPORATED INTO PAGE ONE/);
  assert.match(preview, /agreementClauses\(contract\)/);
});

test("witness and notary sections are optional and hidden when unused", async () => {
  const contract = createNewContract();
  assert.equal(contract.signatureOptions.witnessEnabled, false);
  assert.equal(contract.signatureOptions.notaryEnabled, false);
  const preview = await readFile(new URL("../app/components/DocumentPreview.tsx", import.meta.url), "utf8");
  assert.match(preview, /signatureOptions\.witnessEnabled &&/);
  assert.match(preview, /signatureOptions\.notaryEnabled &&/);
});

test("custom clauses remain optional and print only after explicit inclusion", () => {
  const excluded = { id: "one", number: "20", title: "Optional term", text: "Only when selected.", required: false as const, page: "legal" as const, initialsRequired: false, included: false };
  const included = { ...excluded, included: true };
  assert.equal(isPrintableCustomClause(excluded, "legal"), false);
  assert.equal(isPrintableCustomClause(included, "legal"), true);
  const contract = createNewContract();
  contract.customClauses = [included];
  assert.ok(makeCustomClausesOptional(contract).customClauses.every((item) => item.required === false));
});

test("weekly schedule and payment calculations remain accurate", () => {
  const contract = createNewContract();
  const schedule = calculateSchedule(contract.schedule, contract.payment.overtimeRate);
  assert.equal(schedule.occurrences, 104);
  assert.equal(schedule.rentalHours, 468);
  const payment = calculatePayment(contract);
  assert.equal(payment.baseRent, 38_400);
  assert.equal(payment.estimatedTotal, 40_235);
});

test("signer acknowledgments start unchecked and document hashes track edits", async () => {
  const acknowledgments = emptyAcknowledgments();
  assert.equal(requiredAcknowledgmentLabels.length, 14);
  assert.ok(requiredAcknowledgmentLabels.every(({ key }) => acknowledgments[key] === false));
  const first = createNewContract();
  const firstHash = await hashContract(first);
  const second = createNewContract();
  second.payment.rentalPrice += 1;
  assert.notEqual(firstHash, await hashContract(second));
});

test("repository includes portable GitHub deployment files and standard Next scripts", async () => {
  await access(new URL("../netlify.toml", import.meta.url));
  const nextConfig = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")) as { scripts: Record<string, string>; dependencies: Record<string, string>; devDependencies: Record<string, string> };
  assert.equal(packageJson.scripts.dev, "next dev");
  assert.equal(packageJson.scripts.build, "next build");
  assert.equal(packageJson.devDependencies.vinext, undefined);
  assert.equal(packageJson.devDependencies.wrangler, undefined);
  assert.match(nextConfig, /output:\s*"export"/);
  assert.match(nextConfig, /GITHUB_REPOSITORY/);
});
