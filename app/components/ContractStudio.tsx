"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { Archive, BadgeCheck, Check, ClipboardCheck, Clock3, Copy, Download, FileCheck2, FileDown, FilePenLine, FilePlus2, FileSearch, FileText, FolderOpen, History, LockKeyhole, Maximize2, Menu, MoreHorizontal, PenLine, Plus, Printer, RotateCcw, Save, Send, Settings2, ShieldCheck, Upload, X } from "lucide-react";
import { ContractForm } from "./ContractForm";
import { DocumentPreview, type PreviewMode } from "./DocumentPreview";
import { SignatureDialog } from "./SignatureDialog";
import { createBlankContract, createNewContract, sampleContract } from "@/lib/contract-defaults";
import type { AuditRecord, ContractData, PartySide, SignatureRecord } from "@/lib/contract-types";
import { contractSchema } from "@/lib/contract-schema";
import { contractCompletion, hashContract, makeCustomClausesOptional, shortHash, validateContractData } from "@/lib/contract-utils";
import { downloadContractData, downloadDocx, downloadPdf } from "@/lib/document-export";

const AUTOSAVE_KEY = "covenantdesk-autosave-v1";
const LIBRARY_KEY = "covenantdesk-contract-library-v1";

interface SavedContract {
  id: string;
  savedAt: string;
  contract: ContractData;
}

function normalizeContract(candidate: ContractData): ContractData {
  const base = createNewContract();
  const legacyTerm = (candidate.term || {}) as ContractData["term"] & { minimumMonths?: number };
  const property = { ...base.property, ...(candidate.property || {}) } as ContractData["property"] & Record<string, unknown>;
  for (const legacyKey of [["maximum", "Occupancy"], ["parking", "Spaces"], ["access", "ibility"]].map((parts) => parts.join(""))) delete property[legacyKey];
  const term = {
    ...base.term,
    ...legacyTerm,
    rentalPattern: legacyTerm.rentalPattern || "recurring-weekly",
    threeMonthCommitmentEnabled: legacyTerm.threeMonthCommitmentEnabled ?? ((legacyTerm.minimumMonths || 0) >= 3),
    specialEventDates: legacyTerm.specialEventDates || [],
    unavailableDates: legacyTerm.unavailableDates || [],
  };
  if (term.rentalPattern === "one-day") term.threeMonthCommitmentEnabled = false;
  return makeCustomClausesOptional({
    ...base,
    ...candidate,
    property,
    term,
    payment: { ...base.payment, ...(candidate.payment || {}) },
    securityDeposit: { ...base.securityDeposit, ...(candidate.securityDeposit || {}) },
    cancellation: { ...base.cancellation, ...(candidate.cancellation || {}) },
    signatureOptions: { ...base.signatureOptions, ...(candidate.signatureOptions || {}) },
    customClauses: candidate.customClauses || [],
  });
}

function nowAudit(action: string, details: string, documentHash: string, actor = "Contract Preparer"): AuditRecord {
  return { id: crypto.randomUUID(), at: new Date().toISOString(), action, actor, details, documentHash };
}

function ModalShell({ title, subtitle, onClose, children, wide }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return <div className="modal-backdrop" role="presentation"><section className={`modal simple-modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true"><header className="modal-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button></header><div className="simple-modal-body">{children}</div></section></div>;
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onDone, 3600); return () => window.clearTimeout(timer); }, [message, onDone]);
  return <div className="toast" role="status"><Check size={16} />{message}</div>;
}

function ActionButton({ icon, children, onClick, disabled, primary, title }: { icon?: React.ReactNode; children: React.ReactNode; onClick?: () => void; disabled?: boolean; primary?: boolean; title?: string }) {
  return <button type="button" className={primary ? "primary-button" : "secondary-button"} onClick={onClick} disabled={disabled} title={title}>{icon}{children}</button>;
}

export function ContractStudio() {
  const form = useForm<ContractData>({
    defaultValues: createNewContract(),
    resolver: zodResolver(contractSchema) as unknown as Resolver<ContractData>,
    mode: "onChange",
  });
  const values = useWatch({ control: form.control }) as ContractData;
  const [hydrated, setHydrated] = useState(false);
  const [documentHash, setDocumentHash] = useState("");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("full");
  const [zoom, setZoom] = useState(0.7);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [fullPreview, setFullPreview] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [signatureCenterOpen, setSignatureCenterOpen] = useState(false);
  const [signingSide, setSigningSide] = useState<PartySide | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [savedContracts, setSavedContracts] = useState<SavedContract[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const completion = useMemo(() => contractCompletion(values), [values]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const library = (JSON.parse(localStorage.getItem(LIBRARY_KEY) || "[]") as SavedContract[]).map((item) => ({ ...item, contract: normalizeContract(item.contract) }));
        setSavedContracts(library);
        const autosave = localStorage.getItem(AUTOSAVE_KEY);
        if (autosave) form.reset(normalizeContract(JSON.parse(autosave) as ContractData));
      } catch {
        localStorage.removeItem(AUTOSAVE_KEY);
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [form]);

  useEffect(() => {
    const timer = window.setTimeout(() => { hashContract(values).then(setDocumentHash); }, 250);
    return () => window.clearTimeout(timer);
  }, [values]);

  useEffect(() => {
    if (!hydrated || values.metadata.locked) return;
    const timer = window.setTimeout(() => localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(values)), 800);
    return () => window.clearTimeout(timer);
  }, [hydrated, values]);

  const persistLibrary = (items: SavedContract[]) => {
    setSavedContracts(items);
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(items));
  };

  const saveDraft = async (label = "Draft saved") => {
    setBusyAction("save");
    const current = form.getValues();
    const updated = makeCustomClausesOptional(JSON.parse(JSON.stringify(current)) as ContractData);
    updated.metadata.lastModified = new Date().toISOString().slice(0, 10);
    const hash = await hashContract(updated);
    const versionNumber = (updated.versions.at(-1)?.number || 0) + 1;
    updated.versions.push({ id: crypto.randomUUID(), number: versionNumber, createdAt: new Date().toISOString(), label, hash, locked: updated.metadata.locked });
    updated.audit.push(nowAudit(label, `Version ${versionNumber} preserved in local browser storage.`, hash));
    const record: SavedContract = { id: updated.metadata.contractNumber, savedAt: new Date().toISOString(), contract: updated };
    persistLibrary([record, ...savedContracts.filter((item) => item.id !== record.id)]);
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(updated));
    form.reset(updated);
    setToast(`${label} • Version ${versionNumber}`);
    setBusyAction("");
  };

  const validate = (requireNotice = false) => {
    const current = form.getValues();
    const errors = validateContractData(current).filter((item) => requireNotice || !item.includes("legal-advice notice"));
    setValidationErrors(errors);
    setValidationOpen(true);
    return errors;
  };

  const requireFinalReady = () => {
    const errors = validateContractData(form.getValues());
    if (errors.length) {
      setValidationErrors(errors);
      setValidationOpen(true);
      return false;
    }
    return true;
  };

  const exportPdf = async () => {
    if (!requireFinalReady()) return;
    setBusyAction("pdf");
    const printableContract = makeCustomClausesOptional(form.getValues());
    const hash = await hashContract(printableContract);
    await downloadPdf(printableContract, hash);
    setToast("Professional PDF generated");
    setBusyAction("");
  };

  const exportDocx = async () => {
    if (!requireFinalReady()) return;
    setBusyAction("docx");
    const printableContract = makeCustomClausesOptional(form.getValues());
    const hash = await hashContract(printableContract);
    await downloadDocx(printableContract, hash);
    setToast("Editable DOCX generated");
    setBusyAction("");
  };

  const printAgreement = () => {
    if (!requireFinalReady()) return;
    setPreviewMode("print");
    window.setTimeout(() => window.print(), 100);
  };

  const loadContract = (contract: ContractData) => {
    const normalized = normalizeContract(contract);
    form.reset(normalized);
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(normalized));
    setSavedOpen(false);
    setToast(`Loaded ${contract.metadata.contractNumber}`);
  };

  const startNew = () => {
    if (form.formState.isDirty && !window.confirm("Start a new agreement? Unsaved changes in the current draft will be replaced.")) return;
    const blank = createBlankContract();
    form.reset(blank);
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(blank));
    setToast("New agreement started");
  };

  const loadSample = () => {
    if (form.formState.isDirty && !window.confirm("Load the sample church agreement and replace current unsaved changes?")) return;
    const sample = JSON.parse(JSON.stringify(sampleContract)) as ContractData;
    sample.metadata.contractNumber = `CFRA-SAMPLE-${new Date().getFullYear()}`;
    form.reset(sample);
    setToast("Sample church agreement loaded");
  };

  const duplicate = () => {
    const copy = JSON.parse(JSON.stringify(form.getValues())) as ContractData;
    copy.metadata.contractNumber = `${copy.metadata.contractNumber}-COPY`;
    copy.metadata.status = "Draft";
    copy.metadata.creationDate = new Date().toISOString().slice(0, 10);
    copy.metadata.lastModified = copy.metadata.creationDate;
    copy.metadata.locked = false;
    copy.metadata.attorneyNoticeAccepted = false;
    copy.signatures = {};
    copy.versions = [];
    copy.audit = [nowAudit("Agreement duplicated", `Created from ${form.getValues("metadata.contractNumber")}.`, "Pending first save")];
    form.reset(copy);
    setToast("Editable duplicate created");
  };

  const deleteAgreement = () => {
    const contractNumber = form.getValues("metadata.contractNumber");
    if (!window.confirm(`Delete ${contractNumber} from this browser? This cannot be undone.`)) return;
    const next = savedContracts.filter((item) => item.id !== contractNumber);
    persistLibrary(next);
    localStorage.removeItem(AUTOSAVE_KEY);
    form.reset(createBlankContract());
    setToast("Agreement deleted from this browser");
  };

  const setLifecycleStatus = async (status: "Archived" | "Terminated") => {
    const current = JSON.parse(JSON.stringify(form.getValues())) as ContractData;
    current.metadata.status = status;
    current.metadata.locked = true;
    const hash = await hashContract(current);
    current.audit.push(nowAudit(`Agreement ${status.toLowerCase()}`, `${status} by an authorized local user.`, hash));
    current.versions.push({ id: crypto.randomUUID(), number: (current.versions.at(-1)?.number || 0) + 1, createdAt: new Date().toISOString(), label: status, hash, locked: true });
    form.reset(current);
    setToast(`Agreement ${status.toLowerCase()} and locked`);
  };

  const uploadSignedCopy = async (file?: File) => {
    if (!file) return;
    setBusyAction("upload");
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    const fileHash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    const current = JSON.parse(JSON.stringify(form.getValues())) as ContractData;
    current.audit.push(nowAudit("Signed copy uploaded", `${file.name} (${Math.round(file.size / 1024)} KB) recorded. Browser-local mode stores its name, size, and SHA-256 hash; configure private object storage to retain the file itself.`, fileHash));
    current.versions.push({ id: crypto.randomUUID(), number: (current.versions.at(-1)?.number || 0) + 1, createdAt: new Date().toISOString(), label: "Signed copy uploaded", hash: fileHash, locked: true });
    form.reset(current);
    await saveDraft("Signed copy record saved");
    setToast(`Signed copy recorded • ${shortHash(fileHash)}`);
    setBusyAction("");
  };

  const markExecuted = async () => {
    if (!requireFinalReady()) return;
    const current = JSON.parse(JSON.stringify(form.getValues())) as ContractData;
    const hasUploadedCopy = current.audit.some((item) => item.action === "Signed copy uploaded");
    const electronicComplete = Boolean(current.signatures.lessor && current.signatures.renter);
    if (current.signatureMethod === "electronic" && !electronicComplete) {
      setToast("Both electronic signatures are required before execution");
      setSignatureCenterOpen(true);
      return;
    }
    if (current.signatureMethod !== "electronic" && !hasUploadedCopy && !electronicComplete) {
      setToast("Upload the signed copy or complete both signatures first");
      return;
    }
    current.metadata.status = "Fully Executed";
    current.metadata.locked = true;
    const hash = await hashContract(current);
    current.audit.push(nowAudit("Agreement fully executed", "Final agreement locked against silent editing. Create a duplicate or signed amendment for later changes.", hash, "Administrator"));
    current.versions.push({ id: crypto.randomUUID(), number: (current.versions.at(-1)?.number || 0) + 1, createdAt: new Date().toISOString(), label: "Final executed agreement", hash, locked: true });
    form.reset(current);
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(current));
    setToast("Agreement fully executed and locked");
  };

  const onSigned = async (record: SignatureRecord) => {
    const current = JSON.parse(JSON.stringify(form.getValues())) as ContractData;
    current.signatures[record.party] = record;
    const bothSigned = Boolean(current.signatures.lessor && current.signatures.renter);
    current.metadata.status = bothSigned ? "Fully Executed" : "Partially Signed";
    current.metadata.locked = bothSigned;
    current.audit.push(nowAudit("Electronic signature applied", `${record.printedName} signed for ${record.organization} using a ${record.method} signature in ${record.timeZone}. Email-control confirmation and all required acknowledgments were recorded.`, record.documentHash, record.printedName));
    const finalHash = await hashContract(current);
    current.versions.push({ id: crypto.randomUUID(), number: (current.versions.at(-1)?.number || 0) + 1, createdAt: new Date().toISOString(), label: bothSigned ? "Final electronically signed agreement" : `${record.party} signature`, hash: finalHash, locked: bothSigned });
    if (bothSigned) current.audit.push(nowAudit("Electronic signing completed", "Both required signature records are present. Final document state locked and completion record created.", finalHash, "CovenantDesk"));
    form.reset(current);
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(current));
    setSigningSide(null);
    setSignatureCenterOpen(true);
    setToast(bothSigned ? "Both parties signed • agreement locked" : `${record.printedName} signed successfully`);
  };

  const prepareSignature = (side: PartySide) => {
    if (!requireFinalReady()) return;
    setSignatureCenterOpen(false);
    setSigningSide(side);
  };

  const copyLocalSigningLink = async (side: PartySide) => {
    const token = crypto.randomUUID().replaceAll("-", "");
    const link = `${window.location.origin}${window.location.pathname}?signer=${side}#local-${token}`;
    await navigator.clipboard.writeText(link);
    const current = form.getValues();
    form.setValue("audit", [...current.audit, nowAudit("Local signing link created", `A device-local demonstration link was created for the ${side}. No private contract data or token was written to the audit log.`, documentHash)], { shouldDirty: true });
    setToast("Device-local demonstration link copied");
  };

  const signatureStatus = (side: PartySide) => {
    const record = values.signatures[side];
    return record ? `${record.printedName} • signed ${new Date(record.signedAt).toLocaleDateString()}` : "Awaiting signature";
  };

  return (
    <div className="studio-shell">
      <header className="app-header no-print">
        <div className="brand"><div className="brand-mark"><span>C</span></div><div><strong>CovenantDesk</strong><small>Commercial agreement studio</small></div></div>
        <div className="header-contract"><span className={`status-dot status-${values.metadata.status.toLowerCase().replaceAll(" ", "-")}`}>{values.metadata.status}</span><strong>{values.metadata.contractNumber}</strong><span>Last saved {values.metadata.lastModified}</span></div>
        <div className="header-actions">
          <ActionButton icon={<FolderOpen size={16} />} onClick={() => setSavedOpen(true)}>Agreements</ActionButton>
          <ActionButton icon={<Save size={16} />} onClick={() => saveDraft()} disabled={busyAction === "save" || values.metadata.locked}>{busyAction === "save" ? "Saving…" : "Save draft"}</ActionButton>
          <div className="more-menu-wrap"><button type="button" className="icon-button bordered" onClick={() => setMoreOpen((current) => !current)} aria-label="More contract actions"><MoreHorizontal size={19} /></button>{moreOpen && <div className="more-menu"><button type="button" onClick={startNew}><FilePlus2 size={15} />Start new agreement</button><button type="button" onClick={loadSample}><RotateCcw size={15} />Load sample agreement</button><button type="button" onClick={duplicate}><Copy size={15} />Duplicate agreement</button><button type="button" onClick={() => downloadContractData(values, documentHash)}><FileDown size={15} />Export agreement data</button><button type="button" onClick={() => setAuditOpen(true)}><History size={15} />Audit & version history</button><button type="button" onClick={() => setAdminOpen(true)}><Settings2 size={15} />Administrator policy</button><button type="button" onClick={() => setLifecycleStatus("Archived")}><Archive size={15} />Archive agreement</button><button type="button" onClick={() => setLifecycleStatus("Terminated")}><LockKeyhole size={15} />Terminate agreement</button><button type="button" className="danger" onClick={deleteAgreement}><X size={15} />Delete agreement</button></div>}</div>
        </div>
        <button type="button" className="mobile-menu-button"><Menu size={21} /></button>
      </header>

      <div className="progress-header no-print">
        <div className="progress-copy"><strong>{completion}% complete</strong><span>{completion === 100 ? "Ready for legal review and signature" : "Complete the highlighted requirements before finalization"}</span></div>
        <div className="progress-track" aria-label={`${completion}% complete`}><span style={{ width: `${completion}%` }} /></div>
        <div className="integrity-chip"><ShieldCheck size={15} /><span>Required terms locked</span><code>{shortHash(documentHash)}</code></div>
      </div>

      {values.metadata.locked && <div className="locked-contract-banner no-print"><LockKeyhole size={18} /><div><strong>This executed agreement is locked.</strong><span>Its final document state cannot be silently edited. Duplicate it or prepare a signed amendment to make changes.</span></div><button type="button" onClick={duplicate}>Create editable duplicate</button></div>}

      <nav className="mobile-tabs no-print" aria-label="Workspace view"><button type="button" className={mobileTab === "form" ? "active" : ""} onClick={() => setMobileTab("form")}><FilePenLine size={16} />Contract Form</button><button type="button" className={mobileTab === "preview" ? "active" : ""} onClick={() => setMobileTab("preview")}><FileSearch size={16} />Document Preview</button></nav>

      <main className="studio-workspace">
        <section className={`form-pane no-print mobile-${mobileTab}`}>
          <div className="pane-heading"><div><span>Agreement workspace</span><h1>Build the business terms</h1><p>Complete each section. Your legal document updates alongside the form.</p></div><button type="button" className="sample-button" onClick={loadSample}><FileCheck2 size={16} />Sample church agreement</button></div>
          <fieldset className="form-fieldset" disabled={values.metadata.locked}><ContractForm form={form} /></fieldset>
          <div className="form-bottom-actions"><ActionButton icon={<ClipboardCheck size={16} />} onClick={() => validate(false)}>Validate agreement</ActionButton><ActionButton icon={<Send size={16} />} onClick={() => setSignatureCenterOpen(true)} primary>Prepare for signature</ActionButton></div>
        </section>

        <section className={`preview-pane mobile-${mobileTab}`}>
          <header className="preview-toolbar no-print">
            <div className="preview-modes" role="tablist" aria-label="Preview mode">{([['page-one', 'Page 1'], ['page-two', 'Page 2'], ['full', 'Full'], ['print', 'Print'], ['signing', 'Signing']] as [PreviewMode, string][]).map(([mode, label]) => <button type="button" key={mode} className={previewMode === mode ? "active" : ""} onClick={() => setPreviewMode(mode)}>{label}</button>)}</div>
            <div className="preview-tools"><label><span>Zoom</span><input type="range" min="0.45" max="1" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label><button type="button" className="icon-button bordered" onClick={() => setFullPreview(true)} aria-label="Full-screen preview"><Maximize2 size={17} /></button></div>
          </header>
          <DocumentPreview contract={values} mode={previewMode} zoom={zoom} documentHash={documentHash} />
        </section>
      </main>

      <footer className="action-dock no-print">
        <div className="dock-left"><span><BadgeCheck size={17} />{validationErrors.length ? `${validationErrors.length} item${validationErrors.length === 1 ? "" : "s"} need attention` : "Required clauses protected"}</span><button type="button" onClick={() => setAuditOpen(true)}>Version {values.versions.at(-1)?.number || 0} • {values.audit.length} audit events</button></div>
        <div className="dock-actions">
          <ActionButton icon={<Upload size={16} />} onClick={() => uploadRef.current?.click()} disabled={busyAction === "upload"}>{busyAction === "upload" ? "Recording…" : "Upload signed copy"}</ActionButton>
          <input ref={uploadRef} type="file" className="sr-only" accept="application/pdf,image/*" onChange={(event) => uploadSignedCopy(event.target.files?.[0])} />
          <ActionButton icon={<Printer size={16} />} onClick={printAgreement}>Print</ActionButton>
          <ActionButton icon={<FileText size={16} />} onClick={exportDocx} disabled={busyAction === "docx"}>{busyAction === "docx" ? "Preparing…" : "DOCX"}</ActionButton>
          <ActionButton icon={<Download size={16} />} onClick={exportPdf} disabled={busyAction === "pdf"} primary>{busyAction === "pdf" ? "Preparing PDF…" : "Download PDF"}</ActionButton>
        </div>
      </footer>

      {fullPreview && <div className="fullscreen-preview"><header><div><strong>Full agreement preview</strong><span>{values.metadata.contractNumber} • {shortHash(documentHash)}</span></div><div className="preview-modes">{([['page-one', 'Page 1'], ['page-two', 'Page 2'], ['full', 'Full']] as [PreviewMode, string][]).map(([mode, label]) => <button type="button" key={mode} className={previewMode === mode ? "active" : ""} onClick={() => setPreviewMode(mode)}>{label}</button>)}</div><button type="button" className="icon-button" onClick={() => setFullPreview(false)} aria-label="Close full-screen preview"><X size={22} /></button></header><DocumentPreview contract={values} mode={previewMode} zoom={0.82} documentHash={documentHash} /></div>}

      {validationOpen && <ModalShell title={validationErrors.length ? "Agreement needs attention" : "Agreement passed validation"} subtitle={validationErrors.length ? "Resolve these items before finalization or electronic signing." : "All required business terms and protected provisions are present."} onClose={() => setValidationOpen(false)}>
        {validationErrors.length ? <ul className="validation-list">{validationErrors.map((error) => <li key={error}><X size={15} />{error}</li>)}</ul> : <div className="success-state"><BadgeCheck size={38} /><strong>Required terms verified</strong><p>Page one, the incorporated legal terms, signature sections, schedule, and financial details are present as one document package.</p></div>}
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setValidationOpen(false)}>Return to form</button>{!validationErrors.length && <button type="button" className="primary-button" onClick={() => { setValidationOpen(false); setSignatureCenterOpen(true); }}>Prepare for signature</button>}</div>
      </ModalShell>}

      {savedOpen && <ModalShell title="Saved agreements" subtitle="Private drafts and versions stored in this browser." onClose={() => setSavedOpen(false)} wide>
        <div className="saved-library"><button type="button" className="new-contract-card" onClick={startNew}><Plus size={22} /><span><strong>Start new agreement</strong><small>Begin with a clean protected template</small></span></button>{savedContracts.length ? savedContracts.map((item) => <button type="button" className="saved-contract-card" key={item.id} onClick={() => loadContract(item.contract)}><span className="file-icon"><FileText size={20} /></span><span><strong>{item.contract.metadata.contractNumber}</strong><small>{item.contract.metadata.agreementType}</small><small>{item.contract.property.name || "Property not named"} • {item.contract.renter.legalName || "Renter not named"}</small></span><span><b>{item.contract.metadata.status}</b><small>Saved {new Date(item.savedAt).toLocaleString()}</small></span></button>) : <div className="empty-library"><FolderOpen size={34} /><p>No manually saved agreements yet. Your current work is still auto-saved on this device.</p></div>}</div>
      </ModalShell>}

      {auditOpen && <ModalShell title="Audit and version history" subtitle={`Contract ${values.metadata.contractNumber} • Current hash ${shortHash(documentHash)}`} onClose={() => setAuditOpen(false)} wide>
        <div className="history-grid"><section><h3>Document versions</h3>{values.versions.length ? values.versions.slice().reverse().map((version) => <div className="version-row" key={version.id}><span className={version.locked ? "locked" : ""}>{version.locked ? <LockKeyhole size={15} /> : <FileText size={15} />}</span><div><strong>Version {version.number} • {version.label}</strong><small>{new Date(version.createdAt).toLocaleString()}</small><code>{shortHash(version.hash)}</code></div></div>) : <p className="empty-copy">Save the draft to create the first preserved version.</p>}</section><section><h3>Audit record</h3>{values.audit.slice().reverse().map((record) => <div className="audit-row" key={record.id}><span><Clock3 size={14} /></span><div><strong>{record.action}</strong><small>{record.actor} • {new Date(record.at).toLocaleString()}</small><p>{record.details}</p><code>{shortHash(record.documentHash)}</code></div></div>)}</section></div>
      </ModalShell>}

      {signatureCenterOpen && <ModalShell title="Signature center" subtitle="Choose the signing workflow for each party. Neither valid method is legally subordinate to the other." onClose={() => setSignatureCenterOpen(false)} wide>
        <div className="signature-center-note"><ShieldCheck size={18} /><span><strong>Document fingerprint</strong><code>{shortHash(documentHash)}</code><small>Signers must review the complete document before signing. Browser-local links are demonstrations only; use a configured provider for authenticated external delivery.</small></span></div>
        <div className="signer-cards">{(["lessor", "renter"] as PartySide[]).map((side) => { const party = side === "lessor" ? values.lessor : values.renter; const signed = values.signatures[side]; return <article key={side} className={signed ? "signed" : ""}><header><span>{side === "lessor" ? "Property Owner / Lessor" : "Renter"}</span>{signed ? <b><BadgeCheck size={14} />Signed</b> : <b>Awaiting</b>}</header><h3>{party.legalName}</h3><p>{party.responsible.fullName} • {party.responsible.title}</p><small>{signatureStatus(side)}</small><div>{values.signatureMethod !== "wet-ink" && !signed && <button type="button" className="primary-button" onClick={() => prepareSignature(side)}><PenLine size={15} />Sign electronically</button>}{!signed && <button type="button" className="secondary-button" onClick={() => copyLocalSigningLink(side)}><Copy size={15} />Copy local link</button>}{signed && <button type="button" className="secondary-button" onClick={() => setAuditOpen(true)}><FileCheck2 size={15} />View record</button>}</div></article>; })}</div>
        <div className="signature-center-actions"><button type="button" className="secondary-button" onClick={() => uploadRef.current?.click()}><Upload size={15} />Upload completed wet-ink copy</button><button type="button" className="primary-button" onClick={markExecuted}><LockKeyhole size={15} />Mark as fully executed</button></div>
      </ModalShell>}

      {adminOpen && <ModalShell title="Administrator policy" subtitle="Core language and jurisdiction defaults are separate from normal contract editing." onClose={() => setAdminOpen(false)}>
        <div className="admin-policy-card"><LockKeyhole size={28} /><h3>Protected policy layer</h3><p>Core legal language is code-locked in this browser-local release under revision <strong>{values.admin.requiredClauseRevision}</strong>. Rental-specific cancellation and termination language is generated from the form selections.</p><dl><div><dt>Default jurisdiction</dt><dd>North Carolina</dd></div><div><dt>One-day rentals</dt><dd>Cancellation policy only</dd></div><div><dt>Longer rentals</dt><dd>Optional initial commitment</dd></div><div><dt>Core clauses</dt><dd>18 protected provisions</dd></div></dl><p className="admin-security-copy">Drafts stay in this browser unless exported. For multi-user production use, add authenticated roles, private storage, immutable revision history, and legal-review approval.</p></div>
      </ModalShell>}

      {signingSide && <SignatureDialog contract={values} side={signingSide} onClose={() => setSigningSide(null)} onSigned={onSigned} />}
      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}
