"use client";

import { useState } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { AlertTriangle, Check, ChevronDown, CircleDollarSign, Clock3, FileLock2, GripVertical, Info, Plus, Trash2 } from "lucide-react";
import type { ContractData } from "@/lib/contract-types";
import { calculatePayment, calculateSchedule, customClauseConflicts, formatTime, money } from "@/lib/contract-utils";
import { LEGAL_ADVICE_NOTICE, REQUIRED_CLAUSES } from "@/lib/legal-clauses";

const agreementTypes = ["Commercial facility rental agreement", "Commercial space-use agreement", "Recurring facility-use agreement", "Church facility rental agreement", "Ministry facility rental agreement", "Event-space rental agreement", "Office rental agreement", "Meeting-room rental agreement", "Custom commercial rental agreement"];
const statuses = ["Draft", "Under Review", "Ready for Signature", "Partially Signed", "Fully Executed", "Active", "Expired", "Terminated", "Cancelled", "Archived"];
const entityTypes = ["Individual", "Church", "Ministry", "Nonprofit corporation", "For-profit corporation", "Limited liability company", "Partnership", "Association", "Other organization"];
const rentedAreas = ["Sanctuary", "Fellowship hall", "Classroom", "Conference room", "Office", "Kitchen", "Gymnasium", "Auditorium", "Parking area", "Outdoor area", "Entire building"];
const amenities = ["Restrooms", "Furniture", "Equipment", "Kitchen access", "Sound system", "Audio-visual equipment", "Wi-Fi", "Storage areas"];
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const recurrences = ["Every week", "Every other week", "First week of each month", "Second week of each month", "Third week of each month", "Fourth week of each month", "Last week of each month", "Monthly", "Selected dates only", "Custom recurrence"];
const standardRules = ["No smoking or vaping", "No alcohol or illegal drugs", "No unlawful activity or gambling", "No weapons except as permitted by law and property policy", "No unauthorized guests or vendors", "No unauthorized sales or fundraising", "No subleasing or assignment without written approval", "No overnight occupancy or permanent residency", "No alterations without written permission", "No attaching items to walls without permission", "No candles or open flames", "No loud music outside approved hours", "Use only approved areas and schedule", "Children must be properly supervised", "Secure doors and windows", "Turn off lights and equipment", "Leave property clean and remove trash", "Return furniture to its original location", "Report damage immediately", "Do not duplicate keys or share codes", "Follow fire code, occupancy limits, laws, and property policies", "Remove decorations", "Food only in approved areas", "Animals prohibited unless authorized", "Service-animal rights handled according to applicable law", "Parking only in designated areas"];
const defaultEvents = ["Failure to pay rent", "Repeated late payment", "Returned payments", "Unauthorized use", "Use outside approved hours", "Property damage", "Violation of property rules", "Loss of required insurance", "Illegal activity", "Material misrepresentation", "Unauthorized assignment", "Unauthorized subleasing"];

type Form = UseFormReturn<ContractData>;

function Field({ form, name, label, type = "text", textarea, help, placeholder, prefix, readOnly }: { form: Form; name: string; label: string; type?: string; textarea?: boolean; help?: string; placeholder?: string; prefix?: string; readOnly?: boolean }) {
  const error = name.split(".").reduce<unknown>((current, key) => (current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined), form.formState.errors) as { message?: string } | undefined;
  const options = type === "number" ? { valueAsNumber: true } : undefined;
  return (
    <label className={`field ${error ? "has-error" : ""}`}>
      <span>{label}</span>
      <div className={prefix ? "input-with-prefix" : ""}>{prefix && <b>{prefix}</b>}{textarea ? <textarea rows={3} placeholder={placeholder} readOnly={readOnly} {...form.register(name as never)} /> : <input type={type} placeholder={placeholder} readOnly={readOnly} {...form.register(name as never, options)} />}</div>
      {help && <small>{help}</small>}
      {error?.message && <em role="alert">{String(error.message)}</em>}
    </label>
  );
}

function SelectField({ form, name, label, options, help, disabled }: { form: Form; name: string; label: string; options: string[]; help?: string; disabled?: boolean }) {
  return <label className="field"><span>{label}</span><select disabled={disabled} {...form.register(name as never)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>{help && <small>{help}</small>}</label>;
}

function Toggle({ form, name, label, help, disabled }: { form: Form; name: string; label: string; help?: string; disabled?: boolean }) {
  const checked = Boolean(form.watch(name as never));
  return <label className={`toggle-row ${disabled ? "disabled" : ""}`}><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => form.setValue(name as never, event.target.checked as never, { shouldDirty: true, shouldValidate: true })} /><span className="toggle-control" /><span><strong>{label}</strong>{help && <small>{help}</small>}</span></label>;
}

function ChoiceGrid({ form, name, values }: { form: Form; name: string; values: string[] }) {
  const selected = (form.watch(name as never) || []) as string[];
  const change = (value: string) => form.setValue(name as never, (selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]) as never, { shouldDirty: true, shouldValidate: true });
  return <div className="choice-grid">{values.map((value) => <button type="button" key={value} className={selected.includes(value) ? "selected" : ""} onClick={() => change(value)} aria-pressed={selected.includes(value)}>{selected.includes(value) && <Check size={13} />}{value}</button>)}</div>;
}

function Accordion({ number, title, subtitle, complete, open, onToggle, children, locked }: { number: number; title: string; subtitle: string; complete: boolean; open: boolean; onToggle: () => void; children: React.ReactNode; locked?: boolean }) {
  return (
    <section className={`accordion ${open ? "open" : ""}`}>
      <button type="button" className="accordion-trigger" onClick={onToggle} aria-expanded={open}>
        <span className={`section-status ${complete ? "complete" : ""}`}>{complete ? <Check size={14} /> : number}</span>
        <span className="accordion-title"><strong>{title}</strong><small>{subtitle}</small></span>
        {locked && <span className="locked-pill"><FileLock2 size={12} /> Required</span>}
        <ChevronDown size={18} className="chevron" />
      </button>
      {open && <div className="accordion-content">{children}</div>}
    </section>
  );
}

function SectionIntro({ children }: { children: React.ReactNode }) { return <p className="section-intro">{children}</p>; }

function PartyFields({ form, prefix, renter }: { form: Form; prefix: "lessor" | "renter"; renter?: boolean }) {
  return (
    <>
      <div className="field-grid two-column">
        <Field form={form} name={`${prefix}.legalName`} label="Legal name" />
        <Field form={form} name={`${prefix}.organizationName`} label="Organization / public name" />
        <SelectField form={form} name={`${prefix}.entityType`} label="Entity type" options={entityTypes} />
        <Field form={form} name={`${prefix}.website`} label="Website" />
        <Field form={form} name={`${prefix}.address.street`} label="Mailing address" />
        <Field form={form} name={`${prefix}.address.city`} label="City" />
        <Field form={form} name={`${prefix}.address.state`} label="State" />
        <Field form={form} name={`${prefix}.address.zip`} label="ZIP code" />
        <Field form={form} name={`${prefix}.phone`} label="Telephone" type="tel" />
        <Field form={form} name={`${prefix}.email`} label="Email" type="email" />
      </div>
      <div className="subsection-heading"><div><h4>Responsible representative</h4><p>This person signs for the identified party or organization.</p></div><span className="authority-badge"><Check size={13} /> Authority recorded</span></div>
      <div className="field-grid two-column">
        <Field form={form} name={`${prefix}.responsible.fullName`} label="Full legal name" />
        <Field form={form} name={`${prefix}.responsible.title`} label={renter ? "Title or ministry position" : "Title"} />
        <Field form={form} name={`${prefix}.responsible.phone`} label="Direct telephone" type="tel" />
        <Field form={form} name={`${prefix}.responsible.email`} label="Direct email" type="email" />
        <Field form={form} name={`${prefix}.responsible.emergencyContact`} label="Emergency contact" />
        <SelectField form={form} name={`${prefix}.responsible.signingCapacity`} label="Signing capacity" options={["organizational", "individual"]} />
      </div>
      <Toggle form={form} name={`${prefix}.responsible.hasAuthority`} label="Representative confirms authority to execute the agreement" help="Required before finalization." />
      <div className="inline-toggle-row"><Toggle form={form} name={`${prefix}.incorporated`} label="Incorporated" /><Toggle form={form} name={`${prefix}.nonprofit`} label="Nonprofit status" /><Field form={form} name={`${prefix}.incorporationState`} label="State of incorporation" /></div>
    </>
  );
}

function ScheduleBuilder({ form }: { form: Form }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "schedule" });
  const schedule = form.watch("schedule");
  const totals = calculateSchedule(schedule, form.watch("payment.overtimeRate"));
  const add = () => append({ id: crypto.randomUUID(), day: "Monday", recurrence: "Every week", setupStart: "17:30", rentalStart: "18:00", rentalEnd: "20:00", cleanupEnd: "20:30", firstOccurrence: form.getValues("term.startDate"), lastOccurrence: form.getValues("term.endDate"), expectedAttendees: 25, area: form.getValues("property.rentedAreas.0") || "", additionalCharge: 0, notes: "" });
  return (
    <>
      <div className="calculation-strip">
        <div><Clock3 size={16} /><span><strong>{totals.occurrences}</strong> rental dates</span></div>
        <div><span><strong>{totals.rentalHours.toFixed(1)}</strong> rental hours</span></div>
        <div><span><strong>{totals.setupHours.toFixed(1)}</strong> setup hours</span></div>
        <div><span><strong>{totals.cleanupHours.toFixed(1)}</strong> cleanup hours</span></div>
        <div><span><strong>{money(totals.overtimeCharges)}</strong> est. overtime</span></div>
      </div>
      <div className="schedule-editor">
        {fields.map((field, index) => {
          const current = schedule[index];
          return (
            <article className="schedule-card" key={field.id}>
              <header><GripVertical size={16} /><div><strong>{current?.day || "Rental day"}</strong><small>{current ? `${formatTime(current.rentalStart)}–${formatTime(current.rentalEnd)}` : ""}</small></div><button type="button" className="icon-button danger" onClick={() => remove(index)} aria-label={`Remove ${current?.day || "schedule"}`}><Trash2 size={16} /></button></header>
              <div className="field-grid three-column">
                <SelectField form={form} name={`schedule.${index}.day`} label="Day" options={weekdays} />
                <SelectField form={form} name={`schedule.${index}.recurrence`} label="Recurrence" options={recurrences} />
                <Field form={form} name={`schedule.${index}.expectedAttendees`} label="Expected attendees" type="number" />
                <Field form={form} name={`schedule.${index}.setupStart`} label="Setup starts" type="time" />
                <Field form={form} name={`schedule.${index}.rentalStart`} label="Rental starts" type="time" />
                <Field form={form} name={`schedule.${index}.rentalEnd`} label="Rental ends" type="time" />
                <Field form={form} name={`schedule.${index}.cleanupEnd`} label="Cleanup ends" type="time" />
                <Field form={form} name={`schedule.${index}.firstOccurrence`} label="First occurrence" type="date" />
                <Field form={form} name={`schedule.${index}.lastOccurrence`} label="Last occurrence" type="date" />
                <Field form={form} name={`schedule.${index}.area`} label="Room or area" />
                <Field form={form} name={`schedule.${index}.additionalCharge`} label="Additional charge" type="number" prefix="$" />
                <Field form={form} name={`schedule.${index}.notes`} label="Notes" />
              </div>
            </article>
          );
        })}
      </div>
      <button type="button" className="add-button" onClick={add}><Plus size={15} /> Add rental day</button>
    </>
  );
}

function CustomClauses({ form }: { form: Form }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "customClauses" });
  const clauses = form.watch("customClauses");
  return (
    <>
      <div className="optional-custom-notice"><Info size={16} /><div><strong>Every custom clause is optional.</strong><span>New clauses are excluded from the printed agreement, PDF, and DOCX until “Include in final agreement” is turned on. Empty clauses are always omitted.</span></div></div>
      {fields.map((field, index) => {
        const conflicts = customClauseConflicts(clauses[index]?.text || "");
        return <article className="custom-clause-card" key={field.id}>
          <header><span>Custom clause {index + 1}</span><button type="button" className="icon-button danger" onClick={() => remove(index)} aria-label="Remove custom clause"><Trash2 size={16} /></button></header>
          <div className="field-grid three-column"><Field form={form} name={`customClauses.${index}.number`} label="Clause number" /><Field form={form} name={`customClauses.${index}.title`} label="Clause title" /><SelectField form={form} name={`customClauses.${index}.page`} label="Placement" options={["one", "legal"]} /></div>
          <Field form={form} name={`customClauses.${index}.text`} label="Clause text" textarea />
          <div className="inline-toggle-row custom-clause-options"><Toggle form={form} name={`customClauses.${index}.included`} label="Include in final agreement" help="Leave off to remove this clause from print, PDF, and DOCX." /><Toggle form={form} name={`customClauses.${index}.initialsRequired`} label="Requires initials when included" /></div>
          {conflicts.map((conflict) => <div className="conflict-warning" key={conflict}><AlertTriangle size={15} /><span><strong>Attorney review recommended.</strong> {conflict}</span></div>)}
        </article>;
      })}
      <button type="button" className="add-button" onClick={() => append({ id: crypto.randomUUID(), number: String(REQUIRED_CLAUSES.length + fields.length + 1), title: "", text: "", required: false, page: "legal", initialsRequired: false, included: false })}><Plus size={15} /> Add optional custom clause</button>
    </>
  );
}

export function ContractForm({ form }: { form: Form }) {
  const [openSections, setOpenSections] = useState<number[]>([1, 2]);
  const toggle = (number: number) => setOpenSections((current) => current.includes(number) ? current.filter((item) => item !== number) : [...current, number]);
  const values = form.watch();
  const payment = calculatePayment(values);
  const completion = {
    1: Boolean(values.metadata.contractNumber && values.metadata.effectiveDate), 2: Boolean(values.property.address.street && (values.property.rentedAreas.length || values.property.customArea)), 3: Boolean(values.lessor.legalName && values.lessor.responsible.fullName && values.lessor.responsible.hasAuthority), 4: Boolean(values.renter.legalName && values.renter.responsible.fullName && values.renter.responsible.hasAuthority), 5: Boolean(values.term.startDate && values.term.endDate && values.term.minimumMonths >= 3), 6: values.schedule.length > 0 && values.schedule.every((entry) => entry.rentalStart && entry.rentalEnd), 7: values.payment.rentalPrice >= 0 && Boolean(values.payment.frequency), 8: values.securityDeposit.amount >= 0 && Boolean(values.securityDeposit.dueDate), 9: Boolean(values.notices.lessorAddress && values.notices.renterAddress), 10: values.propertyRules.length > 0, 11: !values.insurance.required || Boolean(values.insurance.policyLimit), 12: values.defaults.selectedDefaults.length > 0, 13: true, 14: Boolean(values.governingLaw.state && values.governingLaw.county), 15: true, 16: Boolean(values.signatureMethod), 17: values.metadata.attorneyNoticeAccepted,
  } as Record<number, boolean>;

  return (
    <div className="contract-form" aria-label="Contract form">
      <Accordion number={1} title="Agreement type" subtitle="Title, dates, number, and workflow status" complete={completion[1]} open={openSections.includes(1)} onToggle={() => toggle(1)}>
        <div className="field-grid two-column"><SelectField form={form} name="metadata.agreementType" label="Agreement type" options={agreementTypes} /><Field form={form} name="metadata.contractNumber" label="Contract number" /><Field form={form} name="metadata.effectiveDate" label="Effective date" type="date" /><SelectField form={form} name="metadata.status" label="Agreement status" options={statuses} /></div>
        {values.metadata.agreementType === "Custom commercial rental agreement" && <Field form={form} name="metadata.customTitle" label="Custom agreement title" />}
        <div className="audit-inline"><span>Created {values.metadata.creationDate}</span><span>Last modified {values.metadata.lastModified}</span></div>
      </Accordion>

      <Accordion number={2} title="Property information" subtitle="Premises, rented areas, access, and permitted use" complete={completion[2]} open={openSections.includes(2)} onToggle={() => toggle(2)}>
        <div className="field-grid two-column"><Field form={form} name="property.name" label="Property name" /><Field form={form} name="property.propertyType" label="Property type" /><Field form={form} name="property.address.street" label="Full street address" /><Field form={form} name="property.address.city" label="City" /><Field form={form} name="property.address.state" label="State" /><Field form={form} name="property.address.zip" label="ZIP code" /><Field form={form} name="property.address.county" label="County" /><Field form={form} name="property.parcelOrUnit" label="Parcel or unit number" /><Field form={form} name="property.building" label="Building number / name" /><Field form={form} name="property.floor" label="Floor" /><Field form={form} name="property.suite" label="Suite" /><Field form={form} name="property.maximumOccupancy" label="Maximum occupancy" type="number" /><Field form={form} name="property.parkingSpaces" label="Parking spaces included" type="number" /></div>
        <div className="choice-section"><h4>Designated rental areas</h4><ChoiceGrid form={form} name="property.rentedAreas" values={rentedAreas} /></div>
        <Field form={form} name="property.customArea" label="Custom area description" />
        <div className="choice-section"><h4>Included access and amenities</h4><ChoiceGrid form={form} name="property.amenities" values={amenities} /></div>
        <div className="field-grid two-column"><Field form={form} name="property.accessibility" label="Accessibility information" textarea /><Field form={form} name="property.entryDoors" label="Approved entry doors" textarea /><Field form={form} name="property.areasIncluded" label="Areas included" textarea /><Field form={form} name="property.areasExcluded" label="Areas excluded" textarea /><Field form={form} name="property.accessInstructions" label="Property access instructions" textarea /><Field form={form} name="property.keyInstructions" label="Key or access-code instructions" textarea /><Field form={form} name="property.permittedUse" label="Permitted use" textarea /><Field form={form} name="property.prohibitedUses" label="Prohibited uses" textarea /><Field form={form} name="property.limitations" label="Special property limitations" textarea /></div>
        <button type="button" className="secondary-button compact">Save as reusable property profile</button>
      </Accordion>

      <Accordion number={3} title="Property Owner / Lessor" subtitle="Legal entity and authorized representative" complete={completion[3]} open={openSections.includes(3)} onToggle={() => toggle(3)}><PartyFields form={form} prefix="lessor" /></Accordion>
      <Accordion number={4} title="Renter / Organization" subtitle="Church, ministry, business, nonprofit, or other renter" complete={completion[4]} open={openSections.includes(4)} onToggle={() => toggle(4)}>
        <PartyFields form={form} prefix="renter" renter />
        <Field form={form} name="renter.purpose" label="Purpose for which the property will be used" textarea />
        <label className="personal-liability-check"><input type="checkbox" checked={values.renter.personalFinancialResponsibility} onChange={(event) => form.setValue("renter.personalFinancialResponsibility", event.target.checked, { shouldDirty: true })} /><span><strong>I voluntarily accept personal financial responsibility for the obligations identified in this Agreement.</strong><small>This option is never preselected. Signing for an organization does not, by itself, impose personal responsibility.</small></span></label>
      </Accordion>

      <Accordion number={5} title="Rental term" subtitle="Start, end, renewal, holdover, and key return" complete={completion[5]} open={openSections.includes(5)} onToggle={() => toggle(5)} locked>
        <div className="locked-policy"><FileLock2 size={17} /><div><strong>Three-month minimum commitment is universally required.</strong><span>Contract creators cannot reduce this setting. It is controlled by required-clause revision {values.admin.requiredClauseRevision}.</span></div><b>3 months</b></div>
        <div className="field-grid three-column"><Field form={form} name="term.startDate" label="Contract start date" type="date" /><Field form={form} name="term.endDate" label="Contract end date" type="date" /><Field form={form} name="term.minimumMonths" label="Minimum rental commitment" type="number" readOnly /><Field form={form} name="term.initialAccessDate" label="Initial access date" type="date" /><Field form={form} name="term.initialAccessTime" label="Initial access time" type="time" /><SelectField form={form} name="term.termType" label="Term structure" options={["fixed", "month-to-month", "auto-renew", "non-renewing", "custom"]} /><Field form={form} name="term.renewalPeriod" label="Renewal period" /><Field form={form} name="term.renewalDate" label="Renewal date" type="date" /><Field form={form} name="term.renewalNoticeDays" label="Required renewal notice (days)" type="number" /><Field form={form} name="term.finalVacateDate" label="Final property-vacate date" type="date" /><Field form={form} name="term.finalKeyReturnDate" label="Final key-return date" type="date" /></div>
        <Toggle form={form} name="term.renewalInWriting" label="Renewal must be approved in writing" />
        <Field form={form} name="term.holdoverTerms" label="Holdover terms" textarea />
      </Accordion>

      <Accordion number={6} title="Rental days and times" subtitle="Recurring weekly schedule with different times and areas" complete={completion[6]} open={openSections.includes(6)} onToggle={() => toggle(6)}><ScheduleBuilder form={form} /></Accordion>

      <Accordion number={7} title="Rental price and payment" subtitle="Pricing method, due dates, fees, and payment summary" complete={completion[7]} open={openSections.includes(7)} onToggle={() => toggle(7)}>
        <div className="field-grid three-column"><SelectField form={form} name="payment.calculationMethod" label="Calculate rent" options={["hour", "day", "week", "month", "occurrence", "flat"]} /><Field form={form} name="payment.rentalPrice" label="Displayed rental price" type="number" prefix="$" /><SelectField form={form} name="payment.frequency" label="Payment frequency" options={["Per occurrence", "Weekly", "Biweekly", "Monthly", "Quarterly", "One time"]} /><Field form={form} name="payment.hourlyRate" label="Hourly rate" type="number" prefix="$" /><Field form={form} name="payment.dailyRate" label="Daily rate" type="number" prefix="$" /><Field form={form} name="payment.weeklyRate" label="Weekly rate" type="number" prefix="$" /><Field form={form} name="payment.monthlyRate" label="Monthly rate" type="number" prefix="$" /><Field form={form} name="payment.flatAmount" label="Flat contract amount" type="number" prefix="$" /><Field form={form} name="payment.pricePerOccurrence" label="Price per occurrence" type="number" prefix="$" /><Field form={form} name="payment.dueDay" label="Rent due date / rule" /><Field form={form} name="payment.firstPaymentDate" label="First payment date" type="date" /><Field form={form} name="payment.finalPaymentDate" label="Final payment date" type="date" /><Field form={form} name="payment.gracePeriodDays" label="Grace period (days)" type="number" /><Field form={form} name="payment.lateFee" label="Late fee" type="number" prefix="$" /><Field form={form} name="payment.returnedPaymentFee" label="Returned-payment fee" type="number" prefix="$" /><Field form={form} name="payment.electronicPaymentFee" label="Electronic-payment fee" type="number" prefix="$" /><Field form={form} name="payment.overtimeRate" label="Overtime rate" type="number" prefix="$" /><Field form={form} name="payment.additionalHourRate" label="Additional-hour rate" type="number" prefix="$" /><Field form={form} name="payment.taxes" label="Taxes, when applicable" type="number" prefix="$" /></div>
        <div className="field-grid two-column"><Field form={form} name="payment.payeeName" label="Payee name" /><Field form={form} name="payment.paymentAddress" label="Mailing address for payments" /><Field form={form} name="payment.electronicInstructions" label="Electronic payment instructions" textarea /></div>
        <div className="inline-toggle-row"><Toggle form={form} name="payment.utilitiesIncluded" label="Utilities included" /><Toggle form={form} name="payment.wifiIncluded" label="Wi-Fi included" /><Toggle form={form} name="payment.cleaningIncluded" label="Cleaning included" /></div>
        <div className="payment-summary"><div className="summary-title"><CircleDollarSign size={18} /><span><strong>Payment summary</strong><small>Calculated from the current contract term and schedule.</small></span></div><dl><div><dt>Base rent</dt><dd>{money(payment.baseRent)}</dd></div><div><dt>Recurring fees</dt><dd>{money(payment.recurringFees)}</dd></div><div><dt>One-time fees</dt><dd>{money(payment.oneTimeFees)}</dd></div><div><dt>Security deposit</dt><dd>{money(values.securityDeposit.amount)}</dd></div><div className="total"><dt>Estimated total charges</dt><dd>{money(payment.estimatedTotal)}</dd></div><div><dt>First amount due</dt><dd>{money(payment.firstAmountDue)}</dd></div></dl></div>
      </Accordion>

      <Accordion number={8} title="Security deposit" subtitle="Amount, payment record, deductions, and refund" complete={completion[8]} open={openSections.includes(8)} onToggle={() => toggle(8)} locked>
        <div className="field-grid three-column"><Field form={form} name="securityDeposit.amount" label="Security-deposit amount" type="number" prefix="$" /><Field form={form} name="securityDeposit.dueDate" label="Deposit due date" type="date" /><SelectField form={form} name="securityDeposit.status" label="Payment status" options={["Not due", "Due", "Paid", "Partially paid", "Refunded"]} /><Field form={form} name="securityDeposit.paymentMethod" label="Payment method" /><Field form={form} name="securityDeposit.datePaid" label="Date paid" type="date" /><Field form={form} name="securityDeposit.receiptNumber" label="Receipt number" /><Field form={form} name="securityDeposit.receivedBy" label="Person who received deposit" /><Field form={form} name="securityDeposit.recordReference" label="Account or record reference" /><Field form={form} name="securityDeposit.refundMethod" label="Refund payment method" /></div>
        <Field form={form} name="securityDeposit.refundAddress" label="Refund mailing address" />
        <div className="locked-policy compact"><FileLock2 size={16} /><div><strong>Required deposit treatment</strong><span>The deposit is not automatically the final rental payment unless both parties expressly agree in a separate signed writing.</span></div></div>
      </Accordion>

      <Accordion number={9} title="Written notices" subtitle="Approved methods, addresses, and receipt rules" complete={completion[9]} open={openSections.includes(9)} onToggle={() => toggle(9)}>
        <div className="field-grid two-column"><Field form={form} name="notices.lessorAddress" label="Property Owner/Lessor notice address" textarea /><Field form={form} name="notices.renterAddress" label="Renter notice address" textarea /><Field form={form} name="notices.lessorEmail" label="Approved lessor email" type="email" /><Field form={form} name="notices.renterEmail" label="Approved renter email" type="email" /><Field form={form} name="notices.designatedRecipient" label="Person designated to receive notice" /><Field form={form} name="notices.businessHours" label="Business hours for hand delivery" /><Field form={form} name="notices.mailedReceivedRule" label="When mailed notice is received" textarea /><Field form={form} name="notices.emailedReceivedRule" label="When emailed notice is received" textarea /></div>
        <div className="toggle-list"><Toggle form={form} name="notices.emailPermitted" label="Email notice permitted" /><Toggle form={form} name="notices.certifiedMailRequired" label="Certified mail required" /><Toggle form={form} name="notices.handDeliveryPermitted" label="Hand delivery permitted" /><Toggle form={form} name="notices.overnightPermitted" label="Overnight delivery permitted" /><Toggle form={form} name="notices.textPermitted" label="Text-message notice permitted" help="Casual social-media messages and verbal conversations are never treated as formal notice." /></div>
      </Accordion>

      <Accordion number={10} title="Property rules" subtitle="Selectable policies and custom rules" complete={completion[10]} open={openSections.includes(10)} onToggle={() => toggle(10)}>
        <ChoiceGrid form={form} name="propertyRules" values={standardRules} />
        <div className="subsection-heading"><div><h4>Custom property rules</h4><p>One rule per line.</p></div></div>
        <textarea className="standalone-textarea" rows={4} value={values.customRules.join("\n")} onChange={(event) => form.setValue("customRules", event.target.value.split("\n").filter(Boolean), { shouldDirty: true })} />
      </Accordion>

      <Accordion number={11} title="Insurance, liability, and risk" subtitle="Coverage, responsibility, and attorney-review flags" complete={completion[11]} open={openSections.includes(11)} onToggle={() => toggle(11)}>
        <div className="attorney-review-banner"><AlertTriangle size={17} /><span><strong>Attorney review recommended.</strong> Insurance, indemnification, waiver, hold-harmless, and limitation language is not automatically enforceable.</span></div>
        <div className="toggle-list"><Toggle form={form} name="insurance.required" label="General liability coverage required" /><Toggle form={form} name="insurance.certificateRequired" label="Certificate of insurance required" /><Toggle form={form} name="insurance.additionalInsured" label="Additional-insured endorsement required" /><Toggle form={form} name="insurance.incidentReportRequired" label="Incident report required" /></div>
        <div className="field-grid two-column"><Field form={form} name="insurance.policyLimit" label="Required policy limit" type="number" prefix="$" /><Field form={form} name="insurance.deadline" label="Insurance-document deadline" type="date" /></div>
        <div className="major-rights-box"><h4>Major risk-allocation provisions</h4><p>These remain off unless affirmatively selected.</p><Toggle form={form} name="insurance.indemnificationSelected" label="Include custom indemnification provision" /><Toggle form={form} name="insurance.holdHarmlessSelected" label="Include hold-harmless provision" /><Toggle form={form} name="insurance.waiverSelected" label="Include waiver language" /><Toggle form={form} name="insurance.limitationSelected" label="Include limitation-of-liability language" /></div>
        {values.insurance.indemnificationSelected && <Field form={form} name="insurance.indemnificationText" label="Custom indemnification language" textarea />}
      </Accordion>

      <Accordion number={12} title="Default, breach, and cancellation" subtitle="Default events, cure, emergencies, and force majeure" complete={completion[12]} open={openSections.includes(12)} onToggle={() => toggle(12)}>
        <ChoiceGrid form={form} name="defaults.selectedDefaults" values={defaultEvents} />
        <div className="field-grid two-column"><Field form={form} name="defaults.curePeriodDays" label="Opportunity-to-cure period (days)" type="number" /><Field form={form} name="defaults.refundProcedure" label="Refund procedure" textarea /></div>
        <div className="toggle-list"><Toggle form={form} name="defaults.writtenNoticeRequired" label="Written notice of default required" /><Toggle form={form} name="defaults.emergencyCancellation" label="Owner cancellation permitted for emergency or unsafe conditions" /><Toggle form={form} name="defaults.reschedulingAllowed" label="Rescheduling permitted when practical" /><Toggle form={form} name="defaults.forceMajeure" label="Include force-majeure terms" /></div>
        <p className="section-note"><Info size={15} /> The mandatory three-month early-termination provision remains separate and cannot be changed here.</p>
      </Accordion>

      <Accordion number={13} title="Optional custom terms" subtitle="Excluded from printed documents unless explicitly included" complete={completion[13]} open={openSections.includes(13)} onToggle={() => toggle(13)}><CustomClauses form={form} /></Accordion>

      <Accordion number={14} title="Governing law and dispute resolution" subtitle="Jurisdiction, venue, and affirmative rights waivers" complete={completion[14]} open={openSections.includes(14)} onToggle={() => toggle(14)}>
        <div className="field-grid two-column"><Field form={form} name="governingLaw.state" label="Governing state" /><Field form={form} name="governingLaw.county" label="Governing county" /><Field form={form} name="governingLaw.venue" label="Court venue" /><Field form={form} name="governingLaw.noticeBeforeActionDays" label="Notice before legal action (days)" type="number" /></div>
        <div className="major-rights-box"><h4>Major rights-waiver provisions</h4><p>None are enabled by default. Clear affirmative selection is required.</p><Toggle form={form} name="governingLaw.mediation" label="Require mediation before suit" /><Toggle form={form} name="governingLaw.arbitration" label="Binding arbitration" /><Toggle form={form} name="governingLaw.attorneyFees" label="Prevailing-party attorney fees" /><Toggle form={form} name="governingLaw.juryTrialWaiver" label="Waiver of jury trial" /></div>
      </Accordion>

      <Accordion number={15} title="Attachments and exhibits" subtitle="Automatically labeled supporting materials" complete={completion[15]} open={openSections.includes(15)} onToggle={() => toggle(15)}>
        <div className="exhibit-editor">{values.exhibits.map((exhibit, index) => <div className="exhibit-row" key={exhibit.id}><span>{exhibit.label}</span><input aria-label={`${exhibit.label} title`} {...form.register(`exhibits.${index}.title`)} /><input aria-label={`${exhibit.label} file name`} placeholder="File name or reference" {...form.register(`exhibits.${index}.fileName`)} /><Toggle form={form} name={`exhibits.${index}.included`} label="Include" /></div>)}</div>
        <p className="section-note"><Info size={15} /> Exhibits are listed on page one and incorporated into the complete document package.</p>
      </Accordion>

      <Accordion number={16} title="Signature method" subtitle="Wet-ink, electronic, or hybrid execution" complete={completion[16]} open={openSections.includes(16)} onToggle={() => toggle(16)} locked>
        <div className="signature-method-cards">{[
          { value: "wet-ink", title: "In-person handwritten", copy: "Produces blank signature lines, printed-name and date fields, with optional signed-copy upload." },
          { value: "electronic", title: "Electronic or digital", copy: "Requires electronic consent, signer confirmations, identity information, audit events, and document hashes." },
          { value: "hybrid", title: "Hybrid", copy: "One party may sign in person while the other signs electronically. Neither method is subordinate." },
        ].map((item) => <label key={item.value} className={values.signatureMethod === item.value ? "selected" : ""}><input type="radio" value={item.value} {...form.register("signatureMethod")} /><span><strong>{item.title}</strong><small>{item.copy}</small></span></label>)}</div>
        <div className="locked-policy compact"><FileLock2 size={16} /><div><strong>Handwritten and electronic signatures have equivalent intended effect.</strong><span>The mandatory equivalency provision appears in the Legal Terms and Conditions and cannot be removed.</span></div></div>
        <Toggle form={form} name="admin.finalPageAcknowledgment" label="Place optional initials acknowledgment at the end of the legal terms" />
      </Accordion>

      <Accordion number={17} title="Review and legal notice" subtitle="Required clauses, document integrity, and final acknowledgment" complete={completion[17]} open={openSections.includes(17)} onToggle={() => toggle(17)} locked>
        <div className="required-clause-list">{REQUIRED_CLAUSES.map((item) => <div key={item.key}><FileLock2 size={14} /><span><strong>{item.number}. {item.title}</strong><small>Required • cannot be removed by contract creators</small></span></div>)}</div>
        <div className="legal-advice-card"><Info size={18} /><div><strong>Legal advice notice</strong><p>{LEGAL_ADVICE_NOTICE}</p><label><input type="checkbox" checked={values.metadata.attorneyNoticeAccepted} onChange={(event) => form.setValue("metadata.attorneyNoticeAccepted", event.target.checked, { shouldDirty: true, shouldValidate: true })} /><span>I acknowledge this notice and understand that attorney review is recommended before signing.</span></label><Toggle form={form} name="metadata.includeDisclaimerInContract" label="Include this general website disclaimer in the final contract" help="Optional; it is not inserted unless selected." /></div></div>
      </Accordion>
    </div>
  );
}
