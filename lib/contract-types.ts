export type AgreementType =
  | "Commercial facility rental agreement"
  | "Commercial space-use agreement"
  | "Recurring facility-use agreement"
  | "Church facility rental agreement"
  | "Ministry facility rental agreement"
  | "Event-space rental agreement"
  | "Office rental agreement"
  | "Meeting-room rental agreement"
  | "Custom commercial rental agreement";

export type AgreementStatus =
  | "Draft"
  | "Under Review"
  | "Ready for Signature"
  | "Partially Signed"
  | "Fully Executed"
  | "Active"
  | "Expired"
  | "Terminated"
  | "Cancelled"
  | "Archived";

export type SignatureMethod = "wet-ink" | "electronic" | "hybrid";
export type PartySide = "lessor" | "renter";

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
}

export interface ResponsibleParty {
  fullName: string;
  title: string;
  phone: string;
  email: string;
  emergencyContact: string;
  hasAuthority: boolean;
  signingCapacity: "organizational" | "individual";
}

export interface ContractParty {
  legalName: string;
  organizationName: string;
  entityType: string;
  address: Address;
  phone: string;
  email: string;
  website: string;
  responsible: ResponsibleParty;
  incorporated: boolean;
  incorporationState: string;
  nonprofit: boolean;
}

export interface PropertyDetails {
  name: string;
  propertyType: string;
  address: Address;
  parcelOrUnit: string;
  building: string;
  floor: string;
  suite: string;
  rentedAreas: string[];
  customArea: string;
  maximumOccupancy: number;
  parkingSpaces: number;
  accessibility: string;
  entryDoors: string;
  areasIncluded: string;
  areasExcluded: string;
  amenities: string[];
  accessInstructions: string;
  keyInstructions: string;
  permittedUse: string;
  prohibitedUses: string;
  limitations: string;
}

export interface RentalTerm {
  startDate: string;
  endDate: string;
  initialAccessDate: string;
  initialAccessTime: string;
  minimumMonths: number;
  termType: "fixed" | "month-to-month" | "auto-renew" | "non-renewing" | "custom";
  renewalPeriod: string;
  renewalDate: string;
  renewalNoticeDays: number;
  renewalInWriting: boolean;
  holdoverTerms: string;
  finalVacateDate: string;
  finalKeyReturnDate: string;
}

export type Recurrence =
  | "Every week"
  | "Every other week"
  | "First week of each month"
  | "Second week of each month"
  | "Third week of each month"
  | "Fourth week of each month"
  | "Last week of each month"
  | "Monthly"
  | "Selected dates only"
  | "Custom recurrence";

export interface ScheduleEntry {
  id: string;
  day: string;
  recurrence: Recurrence;
  setupStart: string;
  rentalStart: string;
  rentalEnd: string;
  cleanupEnd: string;
  firstOccurrence: string;
  lastOccurrence: string;
  expectedAttendees: number;
  area: string;
  additionalCharge: number;
  notes: string;
}

export interface PaymentTerms {
  calculationMethod: "hour" | "day" | "week" | "month" | "occurrence" | "flat";
  rentalPrice: number;
  hourlyRate: number;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  flatAmount: number;
  pricePerOccurrence: number;
  frequency: string;
  dueDay: string;
  firstPaymentDate: string;
  finalPaymentDate: string;
  proratedFirst: number;
  proratedFinal: number;
  gracePeriodDays: number;
  lateFee: number;
  returnedPaymentFee: number;
  electronicPaymentFee: number;
  overtimeRate: number;
  additionalHourRate: number;
  recurringFees: { label: string; amount: number }[];
  oneTimeFees: { label: string; amount: number }[];
  taxes: number;
  acceptedMethods: string[];
  payeeName: string;
  paymentAddress: string;
  electronicInstructions: string;
  utilitiesIncluded: boolean;
  wifiIncluded: boolean;
  cleaningIncluded: boolean;
}

export interface SecurityDeposit {
  amount: number;
  dueDate: string;
  paymentMethod: string;
  status: "Not due" | "Due" | "Paid" | "Partially paid" | "Refunded";
  datePaid: string;
  receiptNumber: string;
  receivedBy: string;
  recordReference: string;
  deductionConditions: string[];
  otherLosses: string;
  refundAddress: string;
  refundMethod: string;
}

export interface WrittenNotices {
  lessorAddress: string;
  renterAddress: string;
  lessorEmail: string;
  renterEmail: string;
  emailPermitted: boolean;
  certifiedMailRequired: boolean;
  handDeliveryPermitted: boolean;
  overnightPermitted: boolean;
  textPermitted: boolean;
  designatedRecipient: string;
  mailedReceivedRule: string;
  emailedReceivedRule: string;
  businessHours: string;
}

export interface InsuranceTerms {
  required: boolean;
  policyLimit: number;
  certificateRequired: boolean;
  additionalInsured: boolean;
  deadline: string;
  responsibilities: string[];
  incidentReportRequired: boolean;
  indemnificationSelected: boolean;
  indemnificationText: string;
  holdHarmlessSelected: boolean;
  waiverSelected: boolean;
  limitationSelected: boolean;
}

export interface DefaultTerms {
  selectedDefaults: string[];
  curePeriodDays: number;
  writtenNoticeRequired: boolean;
  immediateTerminationReasons: string[];
  emergencyCancellation: boolean;
  reschedulingAllowed: boolean;
  refundProcedure: string;
  forceMajeure: boolean;
}

export interface CustomClause {
  id: string;
  number: string;
  title: string;
  text: string;
  required: boolean;
  page: "one" | "legal";
  initialsRequired: boolean;
  included: boolean;
}

export interface GoverningLaw {
  state: string;
  county: string;
  venue: string;
  mediation: boolean;
  arbitration: boolean;
  attorneyFees: boolean;
  juryTrialWaiver: boolean;
  noticeBeforeActionDays: number;
}

export interface Exhibit {
  id: string;
  label: string;
  title: string;
  fileName: string;
  included: boolean;
}

export interface SignerAcknowledgments {
  completeAgreement: boolean;
  reviewedAllPages: boolean;
  understands: boolean;
  sufficientTime: boolean;
  legalAdviceOpportunity: boolean;
  voluntary: boolean;
  noDuress: boolean;
  noImpairment: boolean;
  bindingEffect: boolean;
  evidenceUse: boolean;
  electronicConsent: boolean;
  equivalentEffect: boolean;
  accurateInformation: boolean;
  authority: boolean;
}

export interface SignatureRecord {
  party: PartySide;
  method: "typed" | "drawn" | "uploaded" | "wet-ink";
  typedName: string;
  signatureImage: string;
  printedName: string;
  title: string;
  organization: string;
  email: string;
  signedAt: string;
  timeZone: string;
  documentHash: string;
  acknowledgments: SignerAcknowledgments;
  verified: boolean;
}

export interface AuditRecord {
  id: string;
  at: string;
  action: string;
  actor: string;
  details: string;
  documentHash: string;
}

export interface DocumentVersion {
  id: string;
  number: number;
  createdAt: string;
  label: string;
  hash: string;
  locked: boolean;
}

export interface ContractData {
  metadata: {
    agreementType: AgreementType;
    customTitle: string;
    contractNumber: string;
    effectiveDate: string;
    creationDate: string;
    lastModified: string;
    status: AgreementStatus;
    attorneyNoticeAccepted: boolean;
    includeDisclaimerInContract: boolean;
    locked: boolean;
  };
  property: PropertyDetails;
  lessor: ContractParty;
  renter: ContractParty & {
    purpose: string;
    personalFinancialResponsibility: boolean;
  };
  term: RentalTerm;
  schedule: ScheduleEntry[];
  payment: PaymentTerms;
  securityDeposit: SecurityDeposit;
  notices: WrittenNotices;
  propertyRules: string[];
  customRules: string[];
  insurance: InsuranceTerms;
  defaults: DefaultTerms;
  customClauses: CustomClause[];
  governingLaw: GoverningLaw;
  exhibits: Exhibit[];
  signatureMethod: SignatureMethod;
  signatures: Partial<Record<PartySide, SignatureRecord>>;
  audit: AuditRecord[];
  versions: DocumentVersion[];
  admin: {
    finalPageAcknowledgment: boolean;
    initialsEachLegalPage: boolean;
    requiredClauseRevision: string;
  };
}

