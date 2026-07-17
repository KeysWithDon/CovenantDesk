"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Eraser, PenLine, ShieldCheck, Upload, X } from "lucide-react";
import type { ContractData, PartySide, SignatureRecord, SignerAcknowledgments } from "@/lib/contract-types";
import { emptyAcknowledgments, requiredAcknowledgmentLabels } from "@/lib/contract-defaults";
import { hashContract, shortHash } from "@/lib/contract-utils";

function DrawPad({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const image = new Image();
    image.onload = () => canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.src = value;
  }, [value]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const box = canvas.getBoundingClientRect();
    return { x: (event.clientX - box.left) * (canvas.width / box.width), y: (event.clientY - box.top) * (canvas.height / box.height) };
  };
  const begin = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const context = event.currentTarget.getContext("2d")!;
    const p = point(event);
    context.beginPath();
    context.moveTo(p.x, p.y);
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = event.currentTarget.getContext("2d")!;
    const p = point(event);
    context.strokeStyle = "#0f2a43";
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineTo(p.x, p.y);
    context.stroke();
  };
  const end = () => {
    drawing.current = false;
    if (canvasRef.current) onChange(canvasRef.current.toDataURL("image/png"));
  };
  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div className="draw-pad">
      <canvas ref={canvasRef} width={720} height={180} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end} aria-label="Draw signature here" />
      <button type="button" className="text-button" onClick={clear}><Eraser size={14} /> Clear</button>
    </div>
  );
}

export function SignatureDialog({ contract, side, onClose, onSigned }: { contract: ContractData; side: PartySide; onClose: () => void; onSigned: (record: SignatureRecord) => void }) {
  const party = side === "lessor" ? contract.lessor : contract.renter;
  const [method, setMethod] = useState<"typed" | "drawn" | "uploaded">("typed");
  const [typedName, setTypedName] = useState(party.responsible.fullName);
  const [signatureImage, setSignatureImage] = useState("");
  const [printedName, setPrintedName] = useState(party.responsible.fullName);
  const [title, setTitle] = useState(party.responsible.title);
  const [organization, setOrganization] = useState(party.legalName);
  const [email, setEmail] = useState(party.responsible.email);
  const [emailVerified, setEmailVerified] = useState(false);
  const [acknowledgments, setAcknowledgments] = useState<SignerAcknowledgments>(emptyAcknowledgments());
  const [hash, setHash] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { hashContract(contract).then(setHash); }, [contract]);
  const allChecked = requiredAcknowledgmentLabels.every((item) => acknowledgments[item.key]);
  const signatureReady = method === "typed" ? typedName.trim().length > 1 : Boolean(signatureImage);
  const canSign = allChecked && emailVerified && signatureReady && printedName.trim().length > 1 && title.trim().length > 0 && organization.trim().length > 0 && email.includes("@");

  const upload = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setSignatureImage(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const sign = async () => {
    if (!canSign) return;
    setBusy(true);
    const currentHash = await hashContract(contract);
    onSigned({
      party: side,
      method,
      typedName: method === "typed" ? typedName.trim() : "",
      signatureImage: method === "typed" ? "" : signatureImage,
      printedName: printedName.trim(),
      title: title.trim(),
      organization: organization.trim(),
      email: email.trim(),
      signedAt: new Date().toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      documentHash: currentHash,
      acknowledgments,
      verified: emailVerified,
    });
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal signature-dialog" role="dialog" aria-modal="true" aria-labelledby="signature-title">
        <header className="modal-header">
          <div><span className="modal-kicker"><ShieldCheck size={15} /> Electronic signature</span><h2 id="signature-title">Sign for {side === "lessor" ? "Property Owner/Lessor" : "Renter"}</h2><p>Review the complete agreement and make every confirmation before signing.</p></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close signature dialog"><X size={20} /></button>
        </header>

        <div className="signature-document-check">
          <div><span>Document version</span><strong>{contract.metadata.contractNumber} • Required clauses {contract.admin.requiredClauseRevision}</strong></div>
          <div><span>SHA-256 fingerprint</span><code>{shortHash(hash)}</code></div>
        </div>

        <div className="signature-content">
          <section>
            <h3>Signer identity</h3>
            <div className="field-grid two-column">
              <label className="field"><span>Printed legal name</span><input value={printedName} onChange={(event) => setPrintedName(event.target.value)} /></label>
              <label className="field"><span>Title / ministry position</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
              <label className="field field-span"><span>Organization represented</span><input value={organization} onChange={(event) => setOrganization(event.target.value)} /></label>
              <label className="field field-span"><span>Signer email address</span><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setEmailVerified(false); }} /></label>
            </div>
            <label className="verification-check"><input type="checkbox" checked={emailVerified} onChange={(event) => setEmailVerified(event.target.checked)} /><span><strong>I confirm control of this email address.</strong><small>Production signing should replace this local confirmation with email verification or a one-time passcode.</small></span></label>
          </section>

          <section>
            <h3>Required signer confirmations</h3>
            <p className="section-help">Every confirmation is intentionally unchecked. Signing remains unavailable until all are selected.</p>
            <div className="acknowledgment-list">
              {requiredAcknowledgmentLabels.map((item) => (
                <label key={item.key}><input type="checkbox" checked={acknowledgments[item.key]} onChange={(event) => setAcknowledgments((current) => ({ ...current, [item.key]: event.target.checked }))} /><span>{item.label}</span></label>
              ))}
            </div>
          </section>

          <section>
            <h3>Apply signature</h3>
            <div className="segmented-control signature-method-tabs" role="tablist" aria-label="Signature method">
              <button type="button" className={method === "typed" ? "active" : ""} onClick={() => setMethod("typed")}><PenLine size={15} /> Type</button>
              <button type="button" className={method === "drawn" ? "active" : ""} onClick={() => setMethod("drawn")}><PenLine size={15} /> Draw</button>
              <button type="button" className={method === "uploaded" ? "active" : ""} onClick={() => setMethod("uploaded")}><Upload size={15} /> Upload</button>
            </div>
            {method === "typed" && <label className="typed-signature-field"><span>Type your full legal name as your signature</span><input value={typedName} onChange={(event) => setTypedName(event.target.value)} /><strong>/s/ {typedName || "Your signature"}</strong></label>}
            {method === "drawn" && <DrawPad value={signatureImage} onChange={setSignatureImage} />}
            {method === "uploaded" && <label className="signature-upload"><Upload size={20} /><span>Upload a signature image</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => upload(event.target.files?.[0])} />{signatureImage && <img src={signatureImage} alt="Uploaded signature preview" />}</label>}
            <p className="legal-caution">A typed name, checkbox, image, email address, audit record, or IP address alone does not guarantee enforceability. Attribution, authority, consent, document integrity, and applicable law remain relevant.</p>
          </section>
        </div>

        <footer className="modal-footer">
          <div className={`signing-readiness ${canSign ? "ready" : ""}`}>{canSign ? <><Check size={16} /> Ready to sign</> : `${requiredAcknowledgmentLabels.filter((item) => acknowledgments[item.key]).length} of ${requiredAcknowledgmentLabels.length} confirmations complete`}</div>
          <div><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="button" className="primary-button" disabled={!canSign || busy} onClick={sign}>{busy ? "Securing signature…" : "Sign agreement"}</button></div>
        </footer>
      </section>
    </div>
  );
}

