# CovenantDesk

CovenantDesk is a professional, responsive contract-building application for recurring commercial property and facility-use agreements. It is designed for churches, ministries, nonprofits, businesses, event-space operators, property managers, and commercial property owners.

The app creates customizable document templates. It is not a law firm and does not provide legal advice. Completed agreements should be reviewed by a qualified attorney before signing.

## What is included

- Seventeen accessible accordion sections covering the parties, property, recurring schedule, payment, deposit, notice, rules, insurance, default, custom clauses, governing law, exhibits, signatures, and final review.
- A complete sample agreement for a church using a sanctuary, fellowship hall, classrooms, and parking on Sunday mornings and Wednesday evenings.
- An immutable required-clause layer containing the three-month commitment, early-termination and deposit terms, page-two incorporation, voluntary execution, no-duress, no-manipulation, no-impairment, capacity, authority, signature equivalency, entire agreement, written amendments, severability, counterparts, and attorney-review acknowledgment.
- Live US-Letter page previews with page boundaries, compact legal formatting no smaller than 8.5 points, print styling, signature-line integrity, repeating headers, page numbers, and hashes.
- Weekly and monthly recurrence calculations for occurrences, rental hours, setup time, cleanup time, overtime, recurring fees, one-time fees, and estimated contract value.
- Wet-ink, electronic, and hybrid signature preparation.
- Fourteen separate unchecked electronic-signer confirmations, typed/drawn/uploaded signatures, signer identity fields, consent, time zone, document version, SHA-256 fingerprint, and audit records.
- Browser-local drafts, a saved-agreement library, version history, duplicate/new/archive/terminate workflows, signed-copy recording, and final-document locking.
- PDF, DOCX, JSON, print, and signed-copy upload actions.
- Zod validation, React Hook Form, strict TypeScript data models, and automated contract-integrity tests.

## Run locally

Prerequisite: Node.js 22.13 or later.

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal. On older macOS versions that cannot run the Cloudflare local runtime, use:

```bash
CODEX_LOCAL_PREVIEW=1 npm run dev
```

## Validate

```bash
npm run typecheck
npm test
npm run build
```

The tests verify required clauses, page-one/page-two incorporation, signer acknowledgments, minimum-term enforcement, calculations, hash changes, print font size, workflow coverage, and final locking.

## Local data and privacy

The initial release stores editable drafts, versions, audit metadata, and uploaded-file fingerprints in the current browser. The application does not upload private contracts to a public URL. Browser-local mode records an uploaded signed copy’s name, size, and SHA-256 hash but deliberately does not claim to provide durable private file storage.

Do not use browser-local demonstration signing links for operational external signing. Production signing requires authenticated, expiring, single-purpose links backed by private server-side storage and role checks.

## Production integrations

- [Supabase production guide](docs/SUPABASE.md) covers authentication, organizations, row-level security, contract and profile records, private files, immutable document versions, audit logs, signing tokens, and administrator-only clause revisions.
- [Electronic-signature provider guide](docs/ELECTRONIC-SIGNATURES.md) covers provider envelopes, webhooks, identity verification, signed PDFs, completion certificates, provider evidence, and hash reconciliation.
- Copy `.env.example` to `.env.local` and configure only the services used by your deployment. Never expose a Supabase service-role key or e-signature provider secret to browser code.

## Project structure

```text
app/
  components/              form, preview, signing, and workspace UI
  globals.css              responsive and print-specific styling
lib/
  contract-types.ts        strongly typed contract data model
  contract-defaults.ts     church sample and blank contract
  contract-schema.ts       Zod validation
  contract-utils.ts        calculations, validation, conflicts, hashes
  legal-clauses.ts         protected universal language
  document-export.ts       PDF, DOCX, and data exports
tests/
  contract.test.ts         automated integrity and workflow tests
docs/
  SUPABASE.md
  ELECTRONIC-SIGNATURES.md
```

## Important implementation limits

This release provides a complete local workflow, including contract entry, live document generation, printing, exports, signatures, audit metadata, uploaded-copy fingerprinting, versioning, and locking. Browser storage is device-local and should not be treated as an organization-wide record system, authenticated identity service, secure signing-link service, or private document vault. The production guides describe the server-backed controls required for those uses.

