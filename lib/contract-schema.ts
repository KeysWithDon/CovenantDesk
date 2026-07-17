import { z } from "zod";

const nonNegative = z.coerce.number().min(0, "Must be zero or greater");
const address = z.object({ street: z.string().min(1), city: z.string().min(1), state: z.string().min(2), zip: z.string().min(5), county: z.string() });
const responsible = z.object({
  fullName: z.string().min(1), title: z.string().min(1), phone: z.string(), email: z.string().email(), emergencyContact: z.string(), hasAuthority: z.literal(true), signingCapacity: z.enum(["organizational", "individual"]),
});

const party = z.object({
  legalName: z.string().min(1), organizationName: z.string(), entityType: z.string().min(1), address, phone: z.string(), email: z.string().email(), website: z.string(), responsible,
  incorporated: z.boolean(), incorporationState: z.string(), nonprofit: z.boolean(),
});

export const contractSchema = z.object({
  metadata: z.object({
    agreementType: z.string().min(1), customTitle: z.string(), contractNumber: z.string().min(1), effectiveDate: z.string().min(1), creationDate: z.string(), lastModified: z.string(), status: z.string(), attorneyNoticeAccepted: z.boolean(), includeDisclaimerInContract: z.boolean(), locked: z.boolean(),
  }),
  property: z.object({
    name: z.string().min(1), propertyType: z.string(), address, parcelOrUnit: z.string(), building: z.string(), floor: z.string(), suite: z.string(), rentedAreas: z.array(z.string()), customArea: z.string(), entryDoors: z.string(), areasIncluded: z.string(), areasExcluded: z.string(), amenities: z.array(z.string()), accessInstructions: z.string(), keyInstructions: z.string(), permittedUse: z.string().min(1), prohibitedUses: z.string(), limitations: z.string(),
  }).refine((data) => data.rentedAreas.length > 0 || data.customArea.trim().length > 0, { message: "Select or describe at least one rented area", path: ["rentedAreas"] }),
  lessor: party,
  renter: party.extend({ purpose: z.string().min(1), personalFinancialResponsibility: z.boolean() }),
  term: z.object({
    rentalPattern: z.enum(["one-day", "recurring-weekly", "multi-day", "custom"]), startDate: z.string().min(1), endDate: z.string().min(1), initialAccessDate: z.string(), initialAccessTime: z.string(), threeMonthCommitmentEnabled: z.boolean(), noticePeriodDays: nonNegative, specialEventDates: z.array(z.string()), unavailableDates: z.array(z.string()), termType: z.string(), renewalPeriod: z.string(), renewalDate: z.string(), renewalNoticeDays: nonNegative, renewalInWriting: z.boolean(), holdoverTerms: z.string(), finalVacateDate: z.string(), finalKeyReturnDate: z.string(),
  }).superRefine((term, context) => {
    if (new Date(term.endDate) < new Date(term.startDate)) context.addIssue({ code: "custom", message: "End date must follow start date", path: ["endDate"] });
    if (term.rentalPattern === "one-day" && term.startDate !== term.endDate) context.addIssue({ code: "custom", message: "One-day rentals must start and end on the same date", path: ["endDate"] });
    if (term.rentalPattern === "one-day" && term.threeMonthCommitmentEnabled) context.addIssue({ code: "custom", message: "This commitment is unavailable for a one-day rental", path: ["threeMonthCommitmentEnabled"] });
  }),
  schedule: z.array(z.object({
    id: z.string(), day: z.string().min(1), recurrence: z.string(), setupStart: z.string().min(1), rentalStart: z.string().min(1), rentalEnd: z.string().min(1), cleanupEnd: z.string().min(1), firstOccurrence: z.string().min(1), lastOccurrence: z.string().min(1), expectedAttendees: nonNegative, area: z.string().min(1), additionalCharge: nonNegative, notes: z.string(),
  })).min(1),
  payment: z.object({ rentalPrice: nonNegative, frequency: z.string().min(1) }).passthrough(),
  securityDeposit: z.object({ amount: nonNegative, inspectionDays: nonNegative }).passthrough(),
  cancellation: z.object({ policyType: z.enum(["fully-refundable", "partially-refundable", "nonrefundable-reservation", "custom"]), refundUntil: z.string(), partialRefundPercent: z.coerce.number().min(0).max(100), reservationPayment: nonNegative, customPolicy: z.string() }),
  notices: z.object({ lessorAddress: z.string().min(1), renterAddress: z.string().min(1) }).passthrough(),
}).passthrough();
