import type { ContractData, PartySide } from "@/lib/contract-types";
import { agreementTitle, calculatePayment, formatDate, formatTime, isPrintableCustomClause, money, occurrenceCount, shortHash } from "@/lib/contract-utils";
import { LEGAL_ADVICE_NOTICE, PAGE_ONE_INCORPORATION_NOTICE, REQUIRED_CLAUSES, SIGNATURE_ACKNOWLEDGMENT } from "@/lib/legal-clauses";

export type PreviewMode = "page-one" | "page-two" | "full" | "print" | "signing";

function SignatureBlock({ contract, side }: { contract: ContractData; side: PartySide }) {
  const party = side === "lessor" ? contract.lessor : contract.renter;
  const record = contract.signatures[side];
  return (
    <section className="signature-block">
      <p className="document-eyebrow">{side === "lessor" ? "For the Property Owner/Lessor" : "For the Renter, Church, Ministry, Business, or Organization"}</p>
      <strong>{party.legalName || "Organization name"}</strong>
      <div className="signature-mark" aria-label={`${side} signature`}>
        {record?.signatureImage ? <img src={record.signatureImage} alt={`${record.printedName} signature`} /> : record?.typedName ? <span>/s/ {record.typedName}</span> : null}
      </div>
      <div className="signature-line" />
      <small>Signature {record?.signedAt ? `• ${new Date(record.signedAt).toLocaleString()}` : ""}</small>
      <p>By, Responsible Party: <strong>{record?.printedName || party.responsible.fullName || "________________"}</strong></p>
      <p>Title: {record?.title || party.responsible.title || "________________"}</p>
      <div className="signature-date-line" />
      <small>Date</small>
    </section>
  );
}

function PageFooter({ page, total, legal, contract, hash }: { page: number; total: number; legal?: boolean; contract: ContractData; hash: string }) {
  return (
    <footer className="document-footer">
      <span>Page {page} of {total}{legal ? " — Legal Terms and Conditions incorporated into page one" : ""}</span>
      <span>Generated {new Date().toLocaleDateString()} • Hash {shortHash(hash)}</span>
    </footer>
  );
}

function PageHeader({ contract, legal }: { contract: ContractData; legal?: boolean }) {
  return (
    <header className="document-header">
      <span>{contract.property.name || "Commercial Property"}</span>
      <span>Contract {contract.metadata.contractNumber}{legal ? " • LEGAL TERMS" : ""}</span>
    </header>
  );
}

function PageOne({ contract, hash, total }: { contract: ContractData; hash: string; total: number }) {
  const totals = calculatePayment(contract);
  const exhibits = contract.exhibits.filter((item) => item.included);
  return (
    <article className="document-page page-one" aria-label="Agreement page one">
      <PageHeader contract={contract} />
      <main className="document-page-body">
        <div className="document-title">
          <div className="document-seal">CD</div>
          <h1>{agreementTitle(contract)}</h1>
          <p>Contract {contract.metadata.contractNumber} <span>•</span> Effective {formatDate(contract.metadata.effectiveDate)}</p>
        </div>

        <section className="party-grid document-section">
          <div>
            <p className="document-eyebrow">Property Owner / Lessor</p>
            <h2>{contract.lessor.legalName || "Not yet provided"}</h2>
            <p>{contract.lessor.responsible.fullName}, {contract.lessor.responsible.title}</p>
            <p>{contract.lessor.address.street}<br />{contract.lessor.address.city}, {contract.lessor.address.state} {contract.lessor.address.zip}</p>
            <p>{contract.lessor.email}</p>
          </div>
          <div>
            <p className="document-eyebrow">Renter</p>
            <h2>{contract.renter.legalName || "Not yet provided"}</h2>
            <p>{contract.renter.responsible.fullName}, {contract.renter.responsible.title}</p>
            <p>{contract.renter.address.street}<br />{contract.renter.address.city}, {contract.renter.address.state} {contract.renter.address.zip}</p>
            <p>{contract.renter.email}</p>
          </div>
        </section>

        <section className="document-section property-summary">
          <p className="document-eyebrow">Property and approved use</p>
          <h2>{contract.property.name}</h2>
          <p>{contract.property.address.street}, {contract.property.address.city}, {contract.property.address.state} {contract.property.address.zip}</p>
          <dl className="document-definition-list">
            <div><dt>Rented area</dt><dd>{[...contract.property.rentedAreas, contract.property.customArea].filter(Boolean).join(", ") || "Not specified"}</dd></div>
            <div><dt>Permitted use</dt><dd>{contract.property.permittedUse || "Not specified"}</dd></div>
          </dl>
        </section>

        <section className="document-section">
          <div className="document-section-heading"><p className="document-eyebrow">Recurring rental schedule</p><span>{totals.occurrences} estimated occurrences</span></div>
          <table className="schedule-table">
            <thead><tr><th>Day</th><th>Recurrence</th><th>Approved time</th><th>Area</th></tr></thead>
            <tbody>
              {contract.schedule.length ? contract.schedule.map((entry) => (
                <tr key={entry.id}>
                  <td><strong>{entry.day}</strong><small>{occurrenceCount(entry)} dates</small></td>
                  <td>{entry.recurrence}</td>
                  <td><strong>{formatTime(entry.rentalStart)}–{formatTime(entry.rentalEnd)}</strong><small>Setup {formatTime(entry.setupStart)} • Cleanup {formatTime(entry.cleanupEnd)}</small></td>
                  <td>{entry.area}</td>
                </tr>
              )) : <tr><td colSpan={4}>No rental schedule has been added.</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="business-terms-grid document-section">
          <div><span>Contract term</span><strong>{formatDate(contract.term.startDate)} – {formatDate(contract.term.endDate)}</strong></div>
          <div><span>Rent</span><strong>{money(contract.payment.rentalPrice)} • {contract.payment.frequency}</strong></div>
          <div><span>Payment due</span><strong>{contract.payment.dueDay}</strong></div>
          <div><span>Security deposit</span><strong>{money(contract.securityDeposit.amount)} • due {formatDate(contract.securityDeposit.dueDate)}</strong></div>
          <div><span>Estimated contract value</span><strong>{money(totals.estimatedTotal)}</strong></div>
          <div><span>Signature method</span><strong>{contract.signatureMethod === "wet-ink" ? "In-person handwritten" : contract.signatureMethod === "electronic" ? "Electronic / digital" : "Hybrid"}</strong></div>
        </section>

        <aside className="commitment-notice">
          <div className="notice-icon">!</div>
          <div><h3>Important three-month commitment</h3><p>The Renter is entering an initial minimum three-month commitment. Early voluntary termination before completion of the first three months may result in forfeiture of the security deposit. After completion of the initial three-month period, termination requires at least fifteen days’ advance written notice. See the complete Early Termination and Security Deposit provision on page two.</p></div>
        </aside>

        <section className="exhibit-line"><span>Exhibits incorporated</span><p>{exhibits.length ? exhibits.map((item) => `${item.label}: ${item.title}`).join(" • ") : "None identified"}</p></section>

        <aside className="incorporation-notice">
          <h3>Notice of terms on page two</h3>
          <p>{PAGE_ONE_INCORPORATION_NOTICE}</p>
        </aside>

        <section className="signature-acknowledgment">
          <strong>DO NOT SIGN THIS AGREEMENT UNTIL YOU HAVE REVIEWED PAGE TWO.</strong>
          <p>{SIGNATURE_ACKNOWLEDGMENT}</p>
        </section>

        <section className="signature-grid">
          <SignatureBlock contract={contract} side="lessor" />
          <SignatureBlock contract={contract} side="renter" />
        </section>
      </main>
      <PageFooter page={1} total={total} contract={contract} hash={hash} />
    </article>
  );
}

function LegalPage({ contract, hash, total, page, clauses, continuation }: { contract: ContractData; hash: string; total: number; page: number; clauses: typeof REQUIRED_CLAUSES; continuation?: boolean }) {
  const customClauses = page === total ? contract.customClauses.filter((item) => isPrintableCustomClause(item, "legal")) : [];
  return (
    <article className="document-page legal-page" aria-label={`Legal terms page ${page}`}>
      <PageHeader contract={contract} legal />
      <main className="document-page-body">
        <div className="legal-title">
          <h1>LEGAL TERMS AND CONDITIONS — INCORPORATED INTO PAGE ONE</h1>
          {!continuation && <p>These Legal Terms and Conditions are incorporated into and form a material part of the Commercial Property Rental Agreement appearing on page one.</p>}
          {continuation && <p>Continuation of the Legal Terms and Conditions incorporated into page one.</p>}
        </div>
        <div className="legal-columns">
          {clauses.map((item) => (
            <section className="legal-clause" key={item.key} data-required-clause={item.key}>
              <h2>{item.number}. {item.title}</h2>
              {item.text.split(/\n\n+/).map((paragraph) => <p key={paragraph.slice(0, 24)}>{paragraph}</p>)}
            </section>
          ))}
          {customClauses.map((item) => (
            <section className="legal-clause custom-legal-clause" key={item.id}>
              <h2>{item.number || "Additional"}. {item.title}</h2>
              <p>{item.text}</p>
              {item.initialsRequired && <div className="clause-initials">Lessor initials: ______ &nbsp; Renter initials: ______</div>}
            </section>
          ))}
          {page === total && contract.metadata.includeDisclaimerInContract && (
            <section className="legal-clause"><h2>Template notice</h2><p>{LEGAL_ADVICE_NOTICE}</p></section>
          )}
        </div>
        {page === total && contract.admin.finalPageAcknowledgment && (
          <section className="final-initials"><strong>Final-page acknowledgment</strong><span>Property Owner/Lessor Initials: __________</span><span>Renter Initials: __________</span></section>
        )}
      </main>
      <PageFooter page={page} total={total} legal contract={contract} hash={hash} />
    </article>
  );
}

// The print template never shrinks legal body text below 8.5pt. Required terms
// are distributed across additional Letter pages instead of being compressed.
const legalChunks = [
  REQUIRED_CLAUSES.slice(0, 5),
  REQUIRED_CLAUSES.slice(5, 7),
  REQUIRED_CLAUSES.slice(7, 14),
  REQUIRED_CLAUSES.slice(14, 23),
  REQUIRED_CLAUSES.slice(23, 24),
  REQUIRED_CLAUSES.slice(24),
];

export function DocumentPreview({ contract, mode, zoom, documentHash }: { contract: ContractData; mode: PreviewMode; zoom: number; documentHash: string }) {
  const total = 1 + legalChunks.length;
  const showPageOne = mode !== "page-two";
  const shownChunks = mode === "page-one" ? [] : mode === "page-two" ? [legalChunks[0]] : legalChunks;
  return (
    <div className={`document-preview mode-${mode}`} style={{ "--preview-zoom": zoom } as React.CSSProperties}>
      <div className="document-stack" aria-live="polite">
        {showPageOne && <PageOne contract={contract} hash={documentHash} total={total} />}
        {shownChunks.map((clauses, index) => <LegalPage key={index} contract={contract} hash={documentHash} total={total} page={index + 2} clauses={clauses} continuation={index > 0} />)}
      </div>
    </div>
  );
}
