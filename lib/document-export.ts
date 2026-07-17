import type { ContractData, SignatureRecord } from "./contract-types";
import { agreementTitle, calculatePayment, formatDate, formatTime, money, shortHash } from "./contract-utils";
import { LEGAL_ADVICE_NOTICE, PAGE_ONE_INCORPORATION_NOTICE, REQUIRED_CLAUSES, SIGNATURE_ACKNOWLEDGMENT } from "./legal-clauses";

const safeFileName = (value: string) => value.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "");

export async function downloadPdf(contract: ContractData, documentHash: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait", compress: true, putOnlyUsedFonts: true });
  const pageWidth = 612;
  const pageHeight = 792;
  const left = 44;
  const right = 568;
  const contentWidth = right - left;
  const navy = [15, 42, 67] as const;
  const gold = [174, 130, 51] as const;
  const gray = [82, 91, 101] as const;
  const totals = calculatePayment(contract);

  const text = (value: string, x: number, y: number, options: { width?: number; size?: number; font?: "times" | "helvetica"; style?: "normal" | "bold" | "italic"; color?: readonly [number, number, number]; align?: "left" | "center" | "right" } = {}) => {
    doc.setFont(options.font || "times", options.style || "normal");
    doc.setFontSize(options.size || 9.5);
    doc.setTextColor(...(options.color || ([33, 37, 41] as const)));
    const lines = options.width ? doc.splitTextToSize(value || "—", options.width) : [value || "—"];
    doc.text(lines, x, y, { align: options.align || "left", lineHeightFactor: 1.14 });
    return y + lines.length * (options.size || 9.5) * 1.14;
  };

  const label = (value: string, x: number, y: number) => text(value.toUpperCase(), x, y, { size: 6.8, font: "helvetica", style: "bold", color: gray });
  const rule = (y: number) => { doc.setDrawColor(...gold); doc.setLineWidth(0.8); doc.line(left, y, right, y); };

  const header = (pageNumber: number, legal = false) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...navy);
    doc.text(contract.property.name || "Commercial Property Agreement", left, 24);
    doc.setFont("helvetica", "normal");
    doc.text(`Contract ${contract.metadata.contractNumber}${legal ? "  •  LEGAL TERMS" : ""}`, right, 24, { align: "right" });
    doc.setDrawColor(198, 203, 208);
    doc.setLineWidth(0.5);
    doc.line(left, 30, right, 30);
  };

  header(1);
  let y = 53;
  y = text(agreementTitle(contract), pageWidth / 2, y, { size: 16, font: "times", style: "bold", color: navy, align: "center" }) + 2;
  text(`Contract ${contract.metadata.contractNumber}  •  Effective ${formatDate(contract.metadata.effectiveDate)}`, pageWidth / 2, y, { size: 8.5, font: "helvetica", color: gray, align: "center" });
  y += 21;
  rule(y);
  y += 16;

  const half = (contentWidth - 20) / 2;
  label("Property Owner / Lessor", left, y);
  label("Renter", left + half + 20, y);
  y += 11;
  text(contract.lessor.legalName, left, y, { width: half, size: 10.2, style: "bold", color: navy });
  text(contract.renter.legalName, left + half + 20, y, { width: half, size: 10.2, style: "bold", color: navy });
  y += 24;
  text(`${contract.lessor.responsible.fullName}, ${contract.lessor.responsible.title}\n${contract.lessor.address.street}, ${contract.lessor.address.city}, ${contract.lessor.address.state} ${contract.lessor.address.zip}\n${contract.lessor.email}`, left, y, { width: half, size: 8.4 });
  text(`${contract.renter.responsible.fullName}, ${contract.renter.responsible.title}\n${contract.renter.address.street}, ${contract.renter.address.city}, ${contract.renter.address.state} ${contract.renter.address.zip}\n${contract.renter.email}`, left + half + 20, y, { width: half, size: 8.4 });
  y += 48;
  rule(y);
  y += 14;

  label("Property and approved use", left, y);
  y += 11;
  y = text(`${contract.property.name} — ${contract.property.address.street}, ${contract.property.address.city}, ${contract.property.address.state} ${contract.property.address.zip}`, left, y, { width: contentWidth, size: 9.6, style: "bold", color: navy });
  y = text(`Rented area: ${[...contract.property.rentedAreas, contract.property.customArea].filter(Boolean).join(", ")}\nPermitted use: ${contract.property.permittedUse}`, left, y + 2, { width: contentWidth, size: 8.7 }) + 7;

  label("Recurring rental schedule", left, y);
  y += 9;
  const columns = [left, left + 73, left + 180, left + 340, right];
  doc.setFillColor(241, 244, 246);
  doc.rect(left, y, contentWidth, 17, "F");
  [["DAY", left + 4], ["RECURRENCE", columns[1] + 4], ["APPROVED TIME", columns[2] + 4], ["AREA", columns[3] + 4]].forEach(([value, x]) => text(String(value), Number(x), y + 11, { size: 6.8, font: "helvetica", style: "bold", color: navy }));
  y += 17;
  for (const entry of contract.schedule.slice(0, 4)) {
    const rowHeight = 27;
    doc.setDrawColor(215, 219, 223);
    doc.line(left, y + rowHeight, right, y + rowHeight);
    text(entry.day, left + 4, y + 11, { size: 8.1, style: "bold" });
    text(entry.recurrence, columns[1] + 4, y + 11, { width: 98, size: 7.3 });
    text(`${formatTime(entry.rentalStart)}–${formatTime(entry.rentalEnd)}\nSetup ${formatTime(entry.setupStart)} • Cleanup ${formatTime(entry.cleanupEnd)}`, columns[2] + 4, y + 10, { width: 151, size: 7.1 });
    text(entry.area, columns[3] + 4, y + 10, { width: right - columns[3] - 8, size: 7.1 });
    y += rowHeight;
  }
  y += 11;

  const termItems = [
    ["Term", `${formatDate(contract.term.startDate)} – ${formatDate(contract.term.endDate)}`],
    ["Rent", `${money(contract.payment.rentalPrice)} • ${contract.payment.frequency}`],
    ["Due", contract.payment.dueDay],
    ["Security deposit", `${money(contract.securityDeposit.amount)} due ${formatDate(contract.securityDeposit.dueDate)}`],
    ["Estimated contract value", money(totals.estimatedTotal)],
    ["Signature method", contract.signatureMethod === "wet-ink" ? "In-person handwritten" : contract.signatureMethod === "electronic" ? "Electronic / digital" : "Hybrid (handwritten + electronic)"],
  ];
  const boxY = y;
  const itemWidth = contentWidth / 3;
  doc.setDrawColor(204, 209, 214);
  doc.roundedRect(left, boxY, contentWidth, 59, 3, 3);
  termItems.forEach(([itemLabel, value], index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const x = left + col * itemWidth + 8;
    const itemY = boxY + row * 29 + 12;
    label(itemLabel, x, itemY);
    text(value, x, itemY + 11, { width: itemWidth - 16, size: 7.6, style: "bold", color: navy });
  });
  y += 70;

  doc.setFillColor(252, 248, 235);
  doc.setDrawColor(...gold);
  doc.roundedRect(left, y, contentWidth, 54, 3, 3, "FD");
  text("IMPORTANT THREE-MONTH COMMITMENT", left + 10, y + 15, { size: 8.1, font: "helvetica", style: "bold", color: navy });
  text("The Renter is entering an initial minimum three-month commitment. Early voluntary termination before completion of the first three months may result in forfeiture of the security deposit. After completion of the initial three-month period, termination requires at least fifteen days’ advance written notice. See the complete Early Termination and Security Deposit provision on page two.", left + 10, y + 29, { width: contentWidth - 20, size: 7.2 });
  y += 64;

  const exhibits = contract.exhibits.filter((item) => item.included).map((item) => `${item.label}: ${item.title}`).join(" • ") || "None identified";
  label("Exhibits incorporated", left, y);
  y = text(exhibits, left, y + 11, { width: contentWidth, size: 7.5 }) + 7;

  doc.setFillColor(242, 245, 248);
  doc.setDrawColor(...navy);
  const noticeHeight = 67;
  doc.roundedRect(left, y, contentWidth, noticeHeight, 3, 3, "FD");
  text("NOTICE OF TERMS ON PAGE TWO", left + 10, y + 14, { size: 8, font: "helvetica", style: "bold", color: navy });
  text(PAGE_ONE_INCORPORATION_NOTICE, left + 10, y + 28, { width: contentWidth - 20, size: 7.2 });
  y += noticeHeight + 8;
  text("DO NOT SIGN THIS AGREEMENT UNTIL YOU HAVE REVIEWED PAGE TWO.", pageWidth / 2, y + 7, { size: 7.8, font: "helvetica", style: "bold", color: navy, align: "center" });
  text(SIGNATURE_ACKNOWLEDGMENT, left, y + 19, { width: contentWidth, size: 6.7 });
  y += 59;

  const drawSignature = (record: SignatureRecord | undefined, x: number, width: number, sideLabel: string, organization: string, responsible: string, titleValue: string) => {
    label(sideLabel, x, y);
    text(organization, x, y + 12, { width, size: 7.2, style: "bold" });
    const lineY = y + 42;
    if (record?.signatureImage) {
      try { doc.addImage(record.signatureImage, "PNG", x, lineY - 20, Math.min(width * 0.65, 115), 20); } catch { /* preserve the printable line */ }
    } else if (record?.typedName) {
      text(`/s/ ${record.typedName}`, x, lineY - 7, { width, size: 10, style: "italic", color: navy });
    }
    doc.setDrawColor(70, 75, 80);
    doc.line(x, lineY, x + width, lineY);
    text("Signature", x, lineY + 9, { size: 6.5, font: "helvetica", color: gray });
    text(`By: ${record?.printedName || responsible}  •  Title: ${record?.title || titleValue}`, x, lineY + 20, { width, size: 6.9 });
    doc.line(x, lineY + 35, x + width, lineY + 35);
    text(`Date${record?.signedAt ? `: ${new Date(record.signedAt).toLocaleDateString()}` : ""}`, x, lineY + 44, { size: 6.5, font: "helvetica", color: gray });
  };
  drawSignature(contract.signatures.lessor, left, half, "For the Property Owner / Lessor", contract.lessor.legalName, contract.lessor.responsible.fullName, contract.lessor.responsible.title);
  drawSignature(contract.signatures.renter, left + half + 20, half, "For the Renter / Organization", contract.renter.legalName, contract.renter.responsible.fullName, contract.renter.responsible.title);

  doc.addPage();
  let legalY = 52;
  const legalPageHeader = () => {
    header(doc.getNumberOfPages(), true);
    text("LEGAL TERMS AND CONDITIONS — INCORPORATED INTO PAGE ONE", pageWidth / 2, 47, { size: 11.2, font: "times", style: "bold", color: navy, align: "center" });
    text("These Legal Terms and Conditions are incorporated into and form a material part of the Commercial Property Rental Agreement appearing on page one.", left, 62, { width: contentWidth, size: 8.5, style: "italic" });
    rule(79);
    legalY = 91;
  };
  legalPageHeader();

  const ensureLegalSpace = (height: number) => {
    if (legalY + height < 750) return;
    doc.addPage();
    legalPageHeader();
  };

  for (const item of REQUIRED_CLAUSES) {
    const heading = `${item.number}. ${item.title.toUpperCase()}`;
    doc.setFont("times", "normal");
    doc.setFontSize(8.7);
    const lines = doc.splitTextToSize(item.text.replace(/\n+/g, " "), contentWidth);
    const estimated = 15 + lines.length * 9.7;
    ensureLegalSpace(Math.min(estimated, 180));
    legalY = text(heading, left, legalY, { size: 9.5, font: "times", style: "bold", color: navy }) + 2;
    for (const paragraph of item.text.split(/\n\n+/)) {
      const paragraphLines = doc.splitTextToSize(paragraph, contentWidth);
      if (legalY + paragraphLines.length * 9.7 > 750) {
        doc.addPage();
        legalPageHeader();
      }
      legalY = text(paragraph, left, legalY, { width: contentWidth, size: 8.7 }) + 4;
    }
  }

  for (const custom of contract.customClauses.filter((item) => item.included && item.page === "legal")) {
    ensureLegalSpace(45);
    legalY = text(`${custom.number || "Additional"}. ${custom.title.toUpperCase()}`, left, legalY, { size: 9.5, style: "bold", color: navy }) + 2;
    legalY = text(custom.text, left, legalY, { width: contentWidth, size: 8.7 }) + 5;
  }

  if (contract.admin.finalPageAcknowledgment) {
    ensureLegalSpace(55);
    rule(legalY + 4);
    legalY += 22;
    text("Property Owner/Lessor Initials: ____________________", left, legalY, { size: 8.7, style: "bold" });
    text("Renter Initials: ____________________", left + contentWidth / 2, legalY, { size: 8.7, style: "bold" });
  }

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(198, 203, 208);
    doc.line(left, 765, right, 765);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...gray);
    const footer = page === 1
      ? `Page 1 of ${totalPages} — ${agreementTitle(contract)} • Generated ${new Date().toLocaleDateString()} • Hash ${shortHash(documentHash)}`
      : `Page ${page} of ${totalPages} — Legal Terms and Conditions incorporated into page one • Hash ${shortHash(documentHash)}`;
    doc.text(footer, pageWidth / 2, 778, { align: "center" });
  }

  doc.setProperties({
    title: `${agreementTitle(contract)} — ${contract.metadata.contractNumber}`,
    subject: "Commercial property rental agreement",
    author: "CovenantDesk Contract Studio",
    keywords: `contract, commercial rental, ${contract.metadata.contractNumber}, ${documentHash}`,
    creator: "CovenantDesk Contract Studio",
  });
  doc.save(`${safeFileName(contract.metadata.contractNumber || "commercial-rental-agreement")}.pdf`);
}

export async function downloadDocx(contract: ContractData, documentHash: string) {
  const {
    AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, Packer, PageBreak, PageNumber, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
  } = await import("docx");
  const { saveAs } = await import("file-saver");
  const totals = calculatePayment(contract);
  const body = (value: string, bold = false) => new Paragraph({ spacing: { after: 90, line: 240 }, children: [new TextRun({ text: value, bold, size: 20, font: "Georgia" })] });
  const small = (value: string, bold = false) => new Paragraph({ spacing: { after: 60, line: 210 }, children: [new TextRun({ text: value, bold, size: 18, font: "Georgia" })] });
  const heading = (value: string) => new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 140, after: 60 }, children: [new TextRun({ text: value, bold: true, color: "0F2A43", size: 22, font: "Georgia" })] });
  const borders = { top: { style: BorderStyle.SINGLE, color: "D2D7DC", size: 2 }, bottom: { style: BorderStyle.SINGLE, color: "D2D7DC", size: 2 }, left: { style: BorderStyle.SINGLE, color: "D2D7DC", size: 2 }, right: { style: BorderStyle.SINGLE, color: "D2D7DC", size: 2 } };

  const scheduleRows = [
    new TableRow({ tableHeader: true, children: ["Day", "Recurrence", "Approved time", "Area"].map((value) => new TableCell({ borders, shading: { fill: "EEF1F4" }, children: [small(value, true)] })) }),
    ...contract.schedule.map((entry) => new TableRow({ children: [entry.day, entry.recurrence, `${formatTime(entry.rentalStart)}–${formatTime(entry.rentalEnd)} (setup ${formatTime(entry.setupStart)}; cleanup ${formatTime(entry.cleanupEnd)})`, entry.area].map((value) => new TableCell({ borders, children: [small(value)] })) })),
  ];

  const sections = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: agreementTitle(contract), bold: true, size: 32, color: "0F2A43", font: "Georgia" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: `Contract ${contract.metadata.contractNumber} • Effective ${formatDate(contract.metadata.effectiveDate)}`, size: 18, color: "555F69", font: "Arial" })] }),
    heading("1. PARTIES"),
    body(`Property Owner/Lessor: ${contract.lessor.legalName}, by ${contract.lessor.responsible.fullName}, ${contract.lessor.responsible.title}.`),
    body(`Renter: ${contract.renter.legalName}, by ${contract.renter.responsible.fullName}, ${contract.renter.responsible.title}, signing as an authorized representative.`),
    heading("2. PROPERTY AND PERMITTED USE"),
    body(`${contract.property.name}, ${contract.property.address.street}, ${contract.property.address.city}, ${contract.property.address.state} ${contract.property.address.zip}. Rented areas: ${[...contract.property.rentedAreas, contract.property.customArea].filter(Boolean).join(", ")}.`),
    body(`Permitted use: ${contract.property.permittedUse}.`),
    heading("3. TERM AND RECURRING SCHEDULE"),
    body(`${formatDate(contract.term.startDate)} through ${formatDate(contract.term.endDate)}; required minimum initial commitment: three months.`),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: scheduleRows }),
    heading("4. PAYMENT SUMMARY"),
    body(`Rent: ${money(contract.payment.rentalPrice)} ${contract.payment.frequency.toLowerCase()}, due ${contract.payment.dueDay}. Security deposit: ${money(contract.securityDeposit.amount)}, due ${formatDate(contract.securityDeposit.dueDate)}. Estimated total charges: ${money(totals.estimatedTotal)}.`),
    heading("IMPORTANT THREE-MONTH COMMITMENT"),
    body("The Renter is entering an initial minimum three-month commitment. Early voluntary termination before completion of the first three months may result in forfeiture of the security deposit. After completion of the initial three-month period, termination requires at least fifteen days’ advance written notice. See the complete Early Termination and Security Deposit provision in the Legal Terms and Conditions."),
    heading("NOTICE OF TERMS ON PAGE TWO"),
    body(PAGE_ONE_INCORPORATION_NOTICE),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "DO NOT SIGN THIS AGREEMENT UNTIL YOU HAVE REVIEWED PAGE TWO.", bold: true, size: 18, color: "0F2A43", font: "Arial" })] }),
    body(SIGNATURE_ACKNOWLEDGMENT),
    heading("FOR THE PROPERTY OWNER/LESSOR"),
    body(`${contract.lessor.legalName}\nBy, Responsible Party: ${contract.lessor.responsible.fullName}\nTitle: ${contract.lessor.responsible.title}\nSignature: ____________________________________    Date: __________________`),
    heading("FOR THE RENTER, CHURCH, MINISTRY, BUSINESS, OR ORGANIZATION"),
    body(`${contract.renter.legalName}\nBy, Responsible Party: ${contract.renter.responsible.fullName}\nTitle: ${contract.renter.responsible.title}\nSignature: ____________________________________    Date: __________________`),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { after: 80 }, children: [new TextRun({ text: "LEGAL TERMS AND CONDITIONS — INCORPORATED INTO PAGE ONE", bold: true, size: 24, color: "0F2A43", font: "Georgia" })] }),
    small("These Legal Terms and Conditions are incorporated into and form a material part of the Commercial Property Rental Agreement appearing on page one.", true),
    ...REQUIRED_CLAUSES.flatMap((item) => [heading(`${item.number}. ${item.title.toUpperCase()}`), small(item.text)]),
    ...contract.customClauses.filter((item) => item.included && item.page === "legal").flatMap((item) => [heading(`${item.number || "Additional"}. ${item.title.toUpperCase()}`), small(item.text)]),
    ...(contract.metadata.includeDisclaimerInContract ? [heading("TEMPLATE NOTICE"), small(LEGAL_ADVICE_NOTICE)] : []),
    ...(contract.admin.finalPageAcknowledgment ? [heading("FINAL-PAGE ACKNOWLEDGMENT"), body("Property Owner/Lessor Initials: ____________________    Renter Initials: ____________________")] : []),
  ];

  const document = new Document({
    creator: "CovenantDesk Contract Studio",
    title: `${agreementTitle(contract)} — ${contract.metadata.contractNumber}`,
    description: `Tamper-evident source hash ${documentHash}`,
    styles: { default: { document: { run: { font: "Georgia", size: 20, color: "20252A" }, paragraph: { spacing: { line: 240 } } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: `${contract.property.name}    •    Contract ${contract.metadata.contractNumber}`, size: 16, color: "0F2A43", font: "Arial" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 15, font: "Arial" }), new TextRun({ children: [PageNumber.CURRENT], size: 15, font: "Arial" }), new TextRun({ text: ` • Generated ${new Date().toLocaleDateString()} • Hash ${shortHash(documentHash)}`, size: 15, font: "Arial" })] })] }) },
      children: sections,
    }],
  });
  const blob = await Packer.toBlob(document);
  saveAs(blob, `${safeFileName(contract.metadata.contractNumber || "commercial-rental-agreement")}.docx`);
}

export function downloadContractData(contract: ContractData, documentHash: string) {
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), documentHash, requiredClauseRevision: contract.admin.requiredClauseRevision, contract }, null, 2);
  const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeFileName(contract.metadata.contractNumber || "contract")}-data.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

