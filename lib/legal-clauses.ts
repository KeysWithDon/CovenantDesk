export interface RequiredClause {
  number: number;
  key: string;
  title: string;
  text: string;
  immutable: true;
}

const clause = (number: number, key: string, title: string, text: string): RequiredClause =>
  Object.freeze({ number, key, title, text, immutable: true });

export const EARLY_TERMINATION_TEXT = `The Renter agrees to maintain this Agreement for a minimum initial period of three months beginning on the Contract Start Date. If the Renter voluntarily terminates, abandons, discontinues, or otherwise ends the rental arrangement before completing the initial three-month period, the security deposit shall be forfeited to the Property Owner/Lessor to the fullest extent permitted by applicable law.

After the Renter has completed the initial three-month period, the Renter may terminate the Agreement by providing the Property Owner/Lessor with no fewer than fifteen days’ advance written notice. When the required written notice is properly provided after completion of the initial three-month period, the remaining security deposit shall be returned in accordance with this Agreement and applicable law, less any lawful deductions for unpaid rent, unpaid fees, property damage beyond ordinary wear and tear, excessive cleaning, missing property, unauthorized use, additional occupancy, or other documented amounts owed under this Agreement.

The security deposit shall not be treated as liquidated damages or an automatic limitation of either party’s remedies except to the extent expressly stated in this Agreement and permitted by applicable law.`;

export const SIGNATURE_EQUIVALENCY_TEXT = `This Agreement may be executed using an original handwritten or wet-ink signature, an electronic signature, a digital signature, or a combination of these methods. Each party agrees that, to the fullest extent permitted by applicable law, a properly attributable electronic or digital signature is intended to have the same validity, legal force, binding effect, and enforceability as an original handwritten signature.

No party shall challenge the validity of this Agreement solely because it was prepared, delivered, accepted, stored, or signed electronically. Electronic counterparts, printed counterparts, and copies of signed counterparts may be treated as originals to the fullest extent permitted by applicable law.

Nothing in this paragraph guarantees enforceability when a signature is fraudulent, unauthorized, improperly attributed, legally defective, obtained through duress, or otherwise invalid under applicable law.`;

export const VOLUNTARY_EXECUTION_TEXT = `By signing this Agreement, each signer acknowledges, represents, warrants, and agrees that the signer has carefully read and understands this Agreement, including the legal terms, conditions, acknowledgments, and incorporated provisions appearing on page two and any attached exhibits.

Each signer acknowledges that the signer has been provided sufficient time and opportunity to review the complete Agreement, ask questions, request clarification, and consult independent legal counsel or another adviser of the signer’s choosing before signing.

Each signer represents that the signer is executing this Agreement knowingly, intentionally, voluntarily, and as an exercise of the signer’s own free will. The signer further represents that the signer is not signing as a result of duress, coercion, intimidation, manipulation, undue influence, threat, deception, fraudulent inducement, misrepresentation, or improper pressure by any person or party.

Each signer represents that, at the time of signing, the signer is not under the influence of alcohol, illegal drugs, controlled substances, medication, intoxicants, or any physical or mental condition to an extent that prevents the signer from understanding the nature, terms, obligations, risks, and reasonably foreseeable consequences of this Agreement.

Each signer acknowledges that no oral promise, statement, assurance, representation, or agreement has been relied upon except as expressly included in this written Agreement.

Each signer represents that the signer possesses the legal capacity to enter this Agreement. A signer executing this Agreement for a church, ministry, business, nonprofit organization, property owner, renter, or other entity represents that the signer possesses sufficient authorization to bind the identified entity.

The parties intend this Agreement to establish legally binding and enforceable obligations. Each party acknowledges and agrees that the Agreement, its signatures, its electronic records, its audit information, and its authenticated copies may be submitted, presented, admitted, or otherwise used as evidence in a court of law, arbitration, mediation, administrative proceeding, or other legal proceeding, subject to applicable rules of law and evidence.

The parties intend handwritten signatures and properly attributable electronic or digital signatures to have equal legal force and effect to the fullest extent permitted by applicable law.`;

export const REQUIRED_CLAUSES: readonly RequiredClause[] = Object.freeze([
  clause(1, "definitions", "Definitions", "“Agreement” means page one, these Legal Terms and Conditions, and every expressly incorporated exhibit. “Property” means the premises and designated areas identified on page one. “Rental Schedule” means each approved day, time, and recurrence listed on page one or in an incorporated exhibit."),
  clause(2, "rental-term", "Rental Term", "The rental term begins and ends on the dates stated on page one. The required initial commitment is three months and may not be shortened by a contract creator. Any renewal, month-to-month continuation, holdover, or continued access is governed by the selections on page one and any signed amendment."),
  clause(3, "permitted-use", "Permitted Use", "Renter may use only the approved areas, at the approved times, and solely for the permitted use identified on page one. No other use, area, date, or time is authorized without prior written approval."),
  clause(4, "payment", "Payment Obligations", "Renter shall timely pay all rent, fees, taxes, overtime, and other charges described in this Agreement. Acceptance of a partial or late payment does not amend the payment schedule or waive a later default."),
  clause(5, "security-deposit", "Security Deposit", "The security deposit secures performance and may be applied only as permitted by this Agreement and applicable law. It is not automatically the final rental payment unless both parties expressly agree otherwise in a separate signed writing."),
  clause(6, "early-termination", "Early Termination and Security Deposit", EARLY_TERMINATION_TEXT),
  clause(7, "written-notices", "Written Notices", "Formal written notice must be delivered using a method and address approved in this Agreement. A casual verbal conversation or social-media message is not formal written notice. Email or text notice is effective only when expressly selected on page one and attributable to an approved address or number."),
  clause(8, "property-rules", "Property Rules", "Renter and its guests, employees, volunteers, contractors, and vendors shall comply with all selected property rules, occupancy limits, safety requirements, property policies, and applicable laws."),
  clause(9, "care", "Care of Premises", "Renter shall exercise reasonable care, leave the Property clean and secure, return furniture and equipment to their proper locations, remove trash and decorations, and promptly report damage or unsafe conditions."),
  clause(10, "damage", "Damage Responsibility", "To the extent permitted by law, Renter is responsible for documented damage and loss caused by Renter or persons admitted under Renter’s control, excluding ordinary wear and tear."),
  clause(11, "insurance", "Insurance Requirements", "When insurance is required on page one, Renter shall timely provide the specified evidence of coverage. Customized insurance, indemnification, waiver, and risk-allocation terms should be reviewed by qualified counsel and are not represented as automatically enforceable."),
  clause(12, "default-remedies", "Default and Remedies", "A material failure to pay, unauthorized use, serious rule violation, unlawful activity, material misrepresentation, loss of required insurance, unauthorized assignment, or material property damage may constitute default. Notice and cure apply when selected and when required by law; serious safety or unlawful conduct may justify immediate suspension of access to the extent legally permitted."),
  clause(13, "termination", "Termination", "Termination does not erase accrued payment, damage, indemnity, return-of-property, audit, or other obligations that by their nature survive. The mandatory initial commitment and post-commitment notice requirements remain separate from default remedies."),
  clause(14, "assignment", "Assignment and Subleasing", "Renter shall not assign this Agreement, sublease, sublicense, or transfer access without the Property Owner/Lessor’s prior written approval."),
  clause(15, "access", "Access Rights", "Property Owner/Lessor may enter the Property at reasonable times for inspection, maintenance, emergencies, safety, or enforcement, consistent with applicable law. Keys and codes remain controlled property and may not be duplicated or shared without approval."),
  clause(16, "compliance", "Compliance With Law", "Each party shall comply with applicable laws within its control. Renter shall observe fire code, occupancy limits, accessibility obligations applicable to its activities, and all lawful governmental orders."),
  clause(17, "force-majeure", "Force Majeure", "Neither party is liable for delay caused by events beyond reasonable control, including severe weather, utility failure, government order, or unsafe building conditions, except that accrued payment obligations and duties that can reasonably be performed remain due. The parties shall cooperate in good faith concerning lawful rescheduling or refunds selected on page one."),
  clause(18, "governing-law", "Governing Law and Venue", "This Agreement is governed by the state and venue identified on page one, without automatically imposing arbitration, a jury-trial waiver, prevailing-party fees, or another major rights waiver unless affirmatively selected."),
  clause(19, "entire-agreement", "Entire Agreement", "This Agreement, including page one, these Legal Terms and Conditions, and all expressly incorporated exhibits, constitutes the entire agreement between the parties concerning the subject matter addressed herein. It supersedes prior or contemporaneous oral and written discussions, negotiations, statements, representations, and understandings concerning the subject matter. No party has relied upon a statement or promise not expressly included in this Agreement."),
  clause(20, "amendments", "Amendments in Writing", "No amendment, modification, extension, waiver, or termination of this Agreement shall be effective unless contained in a writing that identifies this Agreement and is signed by authorized representatives of both parties, except as otherwise expressly permitted herein."),
  clause(21, "waiver", "Waiver", "A failure or delay in enforcing a provision is not a continuing waiver. A waiver on one occasion does not waive the same or another provision on a later occasion."),
  clause(22, "severability", "Severability", "If any provision of this Agreement is determined by a court of competent jurisdiction to be unlawful, invalid, or unenforceable, that provision shall be enforced to the maximum extent legally permissible or severed when necessary. The remaining provisions shall continue in full force and effect unless doing so would materially defeat the fundamental purpose of the Agreement."),
  clause(23, "counterparts", "Counterparts", "This Agreement may be signed in one or more counterparts. Each signed counterpart shall be treated as an original, and all counterparts together shall constitute one agreement. Counterparts may contain handwritten, electronic, or digital signatures."),
  clause(24, "signature-equivalency", "Handwritten and Electronic Signatures", SIGNATURE_EQUIVALENCY_TEXT),
  clause(25, "voluntary-execution", "Voluntary Execution, Capacity, and Legal Effect", VOLUNTARY_EXECUTION_TEXT),
  clause(26, "attorney-review", "Attorney-Review Acknowledgment", "Each party acknowledges the opportunity to have the complete Agreement reviewed by qualified independent legal counsel before signing. No contract preparer using the template is represented to be acting as legal counsel solely by preparing the document."),
]);

export const PAGE_ONE_INCORPORATION_NOTICE = `This Agreement consists of page one, the Legal Terms and Conditions appearing on page two, and every exhibit expressly incorporated into the Agreement. The legal provisions on page two are material terms of this Agreement and are incorporated into page one as though fully written here. By signing page one, each party confirms that the party received, reviewed, understood, accepted, and agreed to the Legal Terms and Conditions on page two and all incorporated exhibits.`;

export const SIGNATURE_ACKNOWLEDGMENT = `By signing below, each signer confirms that the signer has read, understands, and voluntarily agrees to page one, the Legal Terms and Conditions on page two, and all incorporated exhibits. Each signer further confirms the representations concerning capacity, authority, absence of duress, absence of manipulation, absence of impairment, and intended legal effect contained on page two.`;

export const LEGAL_ADVICE_NOTICE = `This website provides customizable document templates and does not provide legal advice. Contract requirements and enforceability vary according to jurisdiction, property type, facts, and circumstances. The parties should have the completed Agreement reviewed by a qualified attorney before signing.`;

