import type { ContractData } from "./contract-types";

const formattedDate = (value: string) => value
  ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`))
  : "the stated deadline";
const dollars = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

export interface RequiredClause {
  number: number;
  key: string;
  title: string;
  text: string;
  immutable: true;
}

const clause = (number: number, key: string, title: string, text: string): RequiredClause =>
  Object.freeze({ number, key, title, text, immutable: true });

export const SIGNATURE_EQUIVALENCY_TEXT = `This Agreement may be signed by hand, electronically, or by a combination of those methods. A properly attributable electronic signature is intended to have the same effect as a handwritten signature to the fullest extent allowed by law. A signature may still be challenged if it is fraudulent, unauthorized, legally defective, or obtained improperly.`;

export const VOLUNTARY_EXECUTION_TEXT = `Each signer confirms that the signer reviewed the complete Agreement, had enough time to ask questions and seek independent legal advice, understands the Agreement, and signs voluntarily. Each signer also confirms legal capacity and, when signing for an organization, authority to bind that organization. The parties intend the Agreement and its signature records to be usable as evidence, subject to applicable law.`;

export const REQUIRED_CLAUSES: readonly RequiredClause[] = Object.freeze([
  clause(1, "definitions", "Agreement and Property", "This Agreement includes both pages and each exhibit expressly listed on page one. The Property and approved areas are the premises identified on page one."),
  clause(2, "rental-term", "Rental Term", "The rental begins and ends on the dates stated on page one. Only the dates and times shown in the approved schedule are authorized. Special-event dates and unavailable dates shown on page one control over a general recurrence."),
  clause(3, "permitted-use", "Permitted Use", "Renter may use only the approved areas, at the approved times, and only for the stated purpose. Any different use, area, date, or time requires written approval."),
  clause(4, "payment", "Payment", "Renter must pay the rent, fees, taxes, and other charges shown on page one when due. Accepting a partial or late payment does not change the payment schedule or waive a later default."),
  clause(5, "security-deposit", "Security Deposit", "The deposit secures Renter’s obligations and may be used for documented unpaid amounts, damage beyond ordinary wear, excessive cleaning, missing property, or other lawful deductions. The balance must be returned after the selected inspection period, subject to applicable law. The deposit is not automatically the final rental payment."),
  clause(7, "written-notices", "Written Notices", "Formal notice must use an approved method and address listed on page one. A verbal conversation or social-media message is not formal notice. Email or text counts only when expressly allowed on page one."),
  clause(8, "property-rules", "Property Rules", "Renter and persons admitted by Renter must follow the selected property rules, safety requirements, property policies, and applicable laws."),
  clause(9, "care-and-damage", "Care and Damage", "Renter must use reasonable care, leave the Property clean and secure, return furniture and equipment, remove trash and decorations, and promptly report damage or unsafe conditions. Renter is responsible for documented loss caused by Renter or persons under Renter’s control, excluding ordinary wear."),
  clause(10, "insurance", "Insurance and Risk", "When page one requires insurance, Renter must provide the stated proof by the deadline. Any selected indemnity, waiver, or limitation language is subject to applicable law and should be reviewed by qualified counsel."),
  clause(11, "default-remedies", "Default and Remedies", "Material nonpayment, unauthorized use, serious rule violations, unlawful activity, material misrepresentation, loss of required insurance, unauthorized transfer, or material damage may be a default. Notice and an opportunity to cure apply when selected or required by law; urgent safety or unlawful conduct may justify immediate suspension when legally permitted."),
  clause(12, "assignment-access", "Transfer and Access", "Renter may not assign, sublicense, or transfer access without prior written approval. The Property Owner may enter at reasonable times for maintenance, inspection, emergencies, safety, or enforcement, consistent with applicable law. Keys and codes may not be copied or shared without approval."),
  clause(13, "force-majeure", "Events Beyond Control", "Neither party is responsible for delay caused by severe weather, utility failure, government order, unsafe building conditions, or another event beyond reasonable control. Accrued payments remain due, and the parties will follow the rescheduling or refund selections on page one when practical and lawful."),
  clause(14, "governing-law", "Governing Law", "The state and venue stated on page one govern. Arbitration, jury waiver, prevailing-party fees, or another major rights waiver applies only when affirmatively selected and legally enforceable."),
  clause(15, "entire-agreement", "Entire Agreement and Changes", "This Agreement replaces prior discussions about the rental. A change, extension, waiver, or agreed termination must be in a writing that identifies this Agreement and is signed by authorized representatives of both parties, unless this Agreement expressly says otherwise."),
  clause(16, "standard-terms", "Waiver, Severability, and Counterparts", "Delay in enforcing a term is not a continuing waiver. If one term cannot be enforced, the remaining terms continue unless that would defeat the Agreement’s basic purpose. The parties may sign separate counterparts, which together form one Agreement."),
  clause(17, "signature-equivalency", "Signatures", SIGNATURE_EQUIVALENCY_TEXT),
  clause(18, "voluntary-execution", "Voluntary Execution and Authority", VOLUNTARY_EXECUTION_TEXT),
  clause(19, "attorney-review", "Attorney Review", "Each party acknowledges the opportunity to have the complete Agreement reviewed by independent legal counsel. A person using this template is not acting as a party’s lawyer solely by preparing the document."),
]);

function oneDayCancellationText(contract: ContractData) {
  const policy = contract.cancellation;
  if (policy.policyType === "fully-refundable") {
    return `This is a one-day rental. Payments are fully refundable when the Renter cancels${policy.refundUntil ? ` on or before ${formattedDate(policy.refundUntil)}` : " before the rental begins"}. After that point, refunds are subject to applicable law and any written agreement of the parties.`;
  }
  if (policy.policyType === "partially-refundable") {
    return `This is a one-day rental. ${policy.partialRefundPercent}% of payments will be refunded when the Renter cancels${policy.refundUntil ? ` on or before ${formattedDate(policy.refundUntil)}` : " before the rental begins"}. Any remaining amount is retained as the agreed cancellation charge to the extent permitted by law.`;
  }
  if (policy.policyType === "nonrefundable-reservation") {
    return `This is a one-day rental. The ${dollars(policy.reservationPayment)} reservation payment is nonrefundable to the extent permitted by law. Other amounts paid will be refunded after lawful deductions unless the parties agree otherwise in writing.`;
  }
  return `This is a one-day rental. Cancellation policy: ${policy.customPolicy.trim() || "No custom cancellation terms were entered; applicable law controls any refund."}`;
}

export function terminationSummary(contract: ContractData) {
  if (contract.term.rentalPattern === "one-day") {
    return { title: "One-day cancellation policy", text: oneDayCancellationText(contract) };
  }
  if (contract.term.threeMonthCommitmentEnabled) {
    return {
      title: "Initial three-month commitment",
      text: "The Renter accepts an initial three-month commitment. If the Renter voluntarily ends the rental before completing that period, the security deposit may be forfeited to the extent permitted by law. After that period, the Renter may end the Agreement with at least 15 days’ advance written notice.",
    };
  }
  const days = Math.max(0, contract.term.noticePeriodDays);
  return {
    title: "Termination notice",
    text: `Either party may end the rental by giving at least ${days} day${days === 1 ? "" : "s"}’ advance written notice, subject to any fixed end date and applicable law. The security deposit may not be forfeited solely because the Renter did not remain for three months.`,
  };
}

export function agreementClauses(contract: ContractData): readonly RequiredClause[] {
  const conditional = terminationSummary(contract);
  const termination = clause(6, "rental-specific-termination", conditional.title, conditional.text);
  return Object.freeze([...REQUIRED_CLAUSES.slice(0, 5), termination, ...REQUIRED_CLAUSES.slice(5)]);
}

export const PAGE_ONE_INCORPORATION_NOTICE = `This Agreement consists of page one, the Legal Terms and Conditions on page two, and each exhibit expressly listed on page one. The page-two terms are incorporated into page one. By signing page one, each party confirms receiving and accepting both pages and the incorporated exhibits.`;

export const SIGNATURE_ACKNOWLEDGMENT = `By signing below, each signer confirms that the signer reviewed and voluntarily agrees to both pages and every incorporated exhibit, and has the capacity and authority stated on page two.`;

export const LEGAL_ADVICE_NOTICE = `This website provides customizable document templates, not legal advice. Contract requirements vary by jurisdiction and circumstances. The parties should have the completed Agreement reviewed by a qualified attorney before signing.`;
