import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createNewContract, emptyAcknowledgments, requiredAcknowledgmentLabels } from "../lib/contract-defaults";
import { calculatePayment, calculateSchedule, hashContract, isPrintableCustomClause, makeCustomClausesOptional, validateContractData } from "../lib/contract-utils";
import { EARLY_TERMINATION_TEXT, PAGE_ONE_INCORPORATION_NOTICE, REQUIRED_CLAUSES, SIGNATURE_EQUIVALENCY_TEXT, VOLUNTARY_EXECUTION_TEXT } from "../lib/legal-clauses";

test("every universal clause is immutable and includes critical language", () => {
  assert.equal(REQUIRED_CLAUSES.length, 26);
  assert.ok(Object.isFrozen(REQUIRED_CLAUSES));
  assert.ok(REQUIRED_CLAUSES.every(Object.isFrozen));
  assert.match(EARLY_TERMINATION_TEXT, /minimum initial period of three months/i);
  assert.match(EARLY_TERMINATION_TEXT, /no fewer than fifteen days/i);
  assert.match(VOLUNTARY_EXECUTION_TEXT, /not signing as a result of duress, coercion, intimidation, manipulation/i);
  assert.match(VOLUNTARY_EXECUTION_TEXT, /not under the influence of alcohol/i);
  assert.match(SIGNATURE_EQUIVALENCY_TEXT, /same validity, legal force, binding effect, and enforceability/i);
});

test("page one always incorporates page two", async () => {
  assert.match(PAGE_ONE_INCORPORATION_NOTICE, /material terms of this Agreement/i);
  assert.match(PAGE_ONE_INCORPORATION_NOTICE, /incorporated into page one/i);
  const previewSource = await readFile(new URL("../app/components/DocumentPreview.tsx", import.meta.url), "utf8");
  assert.match(previewSource, /PAGE_ONE_INCORPORATION_NOTICE/);
  assert.match(previewSource, /LEGAL TERMS AND CONDITIONS — INCORPORATED INTO PAGE ONE/);
  assert.match(previewSource, /REQUIRED_CLAUSES\.slice/);
});

test("weekly schedule calculations are accurate", () => {
  const contract = createNewContract();
  const schedule = calculateSchedule(contract.schedule, contract.payment.overtimeRate);
  assert.equal(schedule.occurrences, 104);
  assert.equal(schedule.rentalHours, 468);
  assert.equal(schedule.setupHours, 52);
  assert.equal(schedule.cleanupHours, 52);
  const payment = calculatePayment(contract);
  assert.equal(payment.baseRent, 38_400);
  assert.equal(payment.recurringFees, 1_800);
  assert.equal(payment.oneTimeFees, 35);
  assert.equal(payment.estimatedTotal, 40_235);
});

test("minimum commitment and contract date validation cannot be bypassed", () => {
  const contract = createNewContract();
  contract.metadata.attorneyNoticeAccepted = true;
  contract.term.minimumMonths = 2;
  assert.ok(validateContractData(contract).some((error) => /cannot be less than three months/i.test(error)));
  contract.term.minimumMonths = 3;
  contract.term.endDate = "2026-01-01";
  assert.ok(validateContractData(contract).some((error) => /date range is invalid/i.test(error)));
});

test("all signer confirmations begin unchecked", () => {
  const acknowledgments = emptyAcknowledgments();
  assert.equal(requiredAcknowledgmentLabels.length, 14);
  assert.ok(requiredAcknowledgmentLabels.every(({ key }) => acknowledgments[key] === false));
  assert.ok(requiredAcknowledgmentLabels.some(({ label }) => /duress, coercion, intimidation, manipulation/i.test(label)));
  assert.ok(requiredAcknowledgmentLabels.some(({ label }) => /electronic or digital signature/i.test(label)));
});

test("document hashes change when contract content changes", async () => {
  const first = createNewContract();
  const firstHash = await hashContract(first);
  const second = createNewContract();
  second.payment.rentalPrice += 1;
  const secondHash = await hashContract(second);
  assert.equal(firstHash.length, 64);
  assert.notEqual(firstHash, secondHash);
});

test("print legal body never drops below the 8.5 point equivalent", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.legal-clause p[^}]*[\s\S]*?font-size:\s*11\.4px/);
  const exporter = await readFile(new URL("../lib/document-export.ts", import.meta.url), "utf8");
  assert.match(exporter, /size:\s*8\.7/);
  assert.match(exporter, /ensureLegalSpace/);
});

test("wet-ink, electronic, and hybrid workflows remain available", async () => {
  const studio = await readFile(new URL("../app/components/ContractStudio.tsx", import.meta.url), "utf8");
  const form = await readFile(new URL("../app/components/ContractForm.tsx", import.meta.url), "utf8");
  assert.match(form, /value:\s*"wet-ink"/);
  assert.match(form, /value:\s*"electronic"/);
  assert.match(form, /value:\s*"hybrid"/);
  assert.match(studio, /Signed copy uploaded/);
  assert.match(studio, /current\.metadata\.locked = bothSigned/);
  assert.match(studio, /Final agreement locked against silent editing/);
});

test("custom clauses are optional and omitted from printed documents unless explicitly included", async () => {
  const excluded = { id: "one", number: "27", title: "Optional term", text: "Only when selected.", required: false as const, page: "legal" as const, initialsRequired: false, included: false };
  const blank = { ...excluded, id: "two", title: "", included: true };
  const included = { ...excluded, id: "three", included: true };
  assert.equal(isPrintableCustomClause(excluded, "legal"), false);
  assert.equal(isPrintableCustomClause(blank, "legal"), false);
  assert.equal(isPrintableCustomClause(included, "legal"), true);

  const contract = createNewContract();
  contract.customClauses = [{ ...included, required: false }];
  assert.ok(makeCustomClausesOptional(contract).customClauses.every((clause) => clause.required === false));

  const form = await readFile(new URL("../app/components/ContractForm.tsx", import.meta.url), "utf8");
  const preview = await readFile(new URL("../app/components/DocumentPreview.tsx", import.meta.url), "utf8");
  const exporter = await readFile(new URL("../lib/document-export.ts", import.meta.url), "utf8");
  assert.doesNotMatch(form, /Required for this contract/);
  assert.match(form, /included:\s*false/);
  assert.match(preview, /isPrintableCustomClause/);
  assert.match(exporter, /isPrintableCustomClause/);
});
