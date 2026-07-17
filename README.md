# CovenantDesk

CovenantDesk is a mobile-friendly commercial property agreement builder. It creates one-day, recurring weekly, multi-day, and custom-schedule agreements with live page previews and PDF, DOCX, JSON, and print exports.

The application is a customizable document tool, not a law firm or a source of legal advice. Contract requirements vary, so completed agreements should be reviewed by a qualified attorney before signing.

## Highlights

- Property owner, renter, property, schedule, payments, deposit, risk, notice, and signature sections
- Special-event dates and unavailable dates for recurring schedules
- One-day cancellation choices: fully refundable, partially refundable, nonrefundable reservation payment, or custom
- Optional initial three-month commitment for recurring, multi-day, and custom schedules
- No initial-commitment language in one-day agreements
- Optional witness and notary sections, hidden when unused
- Optional custom clauses, excluded from print and exports until explicitly included
- Two-page agreement layout when the entered content fits, with clear page-one/page-two incorporation
- Browser-local drafts, saved versions, audit metadata, hashes, and final-document locking
- Responsive form and preview workspace with print-specific styling
- Strict TypeScript, Zod validation, React Hook Form, and automated policy tests

## Run locally

Requirements: Node.js 20.11 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint
npm test
npm run build
```

`npm run build` creates a portable static site in `out/`.

## Environment

Copy `.env.example` to `.env.local` when you want absolute social-preview URLs for a deployment:

```bash
cp .env.example .env.local
```

Set `NEXT_PUBLIC_SITE_URL` to the public site origin. No API key or hosted database is required for the browser-local application.

## Deploy from GitHub

### Vercel

Import the GitHub repository into Vercel. The framework preset is Next.js; no custom build command is needed. Add `NEXT_PUBLIC_SITE_URL` with the final Vercel domain if desired.

### Netlify

Import the GitHub repository into Netlify. The included `netlify.toml` uses `npm run build` and publishes `out/`.

### GitHub Pages

The project also supports GitHub Pages. Build with `GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=KeysWithDon/CovenantDesk`, and `NEXT_PUBLIC_SITE_URL` set to the Pages URL, then publish the generated `out/` directory from a Pages branch or your preferred Pages workflow. The Next.js configuration automatically adds the repository subpath to assets for that build.

## Data and privacy

Drafts, versions, and audit metadata stay in the current browser unless the user exports them. Clearing site data removes browser-local drafts. The signed-copy action records a file name, size, and SHA-256 fingerprint; it does not upload or retain the file.

Browser-local demonstration signing links are not authenticated external signing links. Multi-user deployments should add private storage, authenticated roles, expiring signing tokens, and immutable server-side audit records. See the optional guides in `docs/`.

## Project structure

```text
app/                         Next.js UI, responsive styling, and print view
app/components/              form, preview, signing, and workspace components
lib/contract-types.ts        agreement data model
lib/contract-defaults.ts     sample and blank agreement data
lib/contract-schema.ts       Zod form validation
lib/contract-utils.ts        calculations, validation, and hashes
lib/legal-clauses.ts         core and rental-specific agreement language
lib/document-export.ts       PDF, DOCX, and JSON exports
tests/contract.test.ts       agreement behavior and repository checks
netlify.toml                 Netlify build and publish settings
```
