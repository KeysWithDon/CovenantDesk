# Supabase production integration

The browser-local release intentionally avoids pretending that local storage is a secure organization-wide database. Use Supabase when contracts must be shared across devices, accessed by multiple roles, or retained as operational records.

## 1. Create the project and private storage

Create a Supabase project in the same region as the primary organization. Create private buckets for:

- `contract-source` — generated unsigned PDFs and DOCX files
- `contract-signed` — uploaded or provider-returned signed originals
- `contract-exhibits` — floor plans, certificates, inventories, photos, and checklists
- `signature-assets` — signature images when a provider does not retain them
- `completion-certificates` — final provider or application evidence packages

Keep every bucket private. Never make contract paths publicly readable. Serve downloads through short-lived signed URLs after server-side authorization.

## 2. Recommended tables

Create these logical tables with UUID primary keys, `organization_id`, timestamps, and soft-deletion columns where appropriate:

- `organizations`
- `organization_members` with roles: administrator, property_owner_lessor, renter_representative, contract_preparer, legal_reviewer, read_only_reviewer, signer
- `contracts` containing searchable metadata and current status
- `contract_versions` containing immutable canonical JSON, required-clause revision, file paths, SHA-256 hash, creator, and lock status
- `properties` and `property_profiles`
- `party_profiles` and `responsible_parties`
- `payment_profiles`, `property_rule_profiles`, `insurance_profiles`, `legal_clause_profiles`, `witness_profiles`, and `notary_profiles`
- `attachments` and `exhibits`
- `signature_requests`
- `signature_records`
- `signer_acknowledgments`
- `audit_events`
- `required_clause_revisions`
- `completion_certificates`

Never update an executed `contract_version`. Insert a new amendment or superseding version and preserve the earlier record.

## 3. Row-level security

Enable row-level security on every table. Derive organization membership from the authenticated user, not from a client-supplied organization ID. Typical policies should:

- restrict reads to members of the contract’s organization or invited signer for one specific signing request;
- restrict writes by role and contract state;
- deny all updates to locked versions, signature records, audit events, hashes, and completion certificates;
- permit required-clause changes only to administrators through a server-side approval path;
- prevent contract creators from selecting an unpublished clause revision;
- keep signing tokens out of ordinary query results.

Use a server-side database function or transaction to finalize a document, compute or verify its hash, insert the locked version, write the audit event, and update status atomically.

## 4. Authentication and signing links

Use Supabase Auth for organization users. For external signers, create a random 256-bit token, store only its cryptographic digest, bind it to one contract version and signer, set a short expiration, and mark it single-use. The signing route should verify:

1. token digest and expiration;
2. signer and contract-version binding;
3. current request status;
4. the exact document hash shown to the signer;
5. completion of every required acknowledgment;
6. verified email or one-time passcode when configured.

Revoke the token immediately after signing or cancellation. Do not place private contract data in the URL.

## 5. Files and hashes

Generate the canonical document server-side. Store the exact bytes delivered to the signer, their SHA-256 hash, the required-clause revision, and a normalized contract-data snapshot. On signed-file return:

- preserve the unsigned source;
- preserve the signed original without rewriting it;
- compute the signed-file hash;
- store the provider envelope ID and webhook ID;
- create a completion certificate;
- deliver expiring authenticated download links to the parties.

## 6. Administrator clause revisions

Each required-clause revision should include the full clause set, jurisdiction, minimum commitment, effective date, author, approver, approval timestamp, and immutable content hash. Publishing a new revision must not mutate agreements already generated or signed under an earlier revision.

## 7. Migration path from local mode

Replace local-library reads and writes in `ContractStudio.tsx` with server actions or API routes. Keep the `ContractData` shape as the canonical application DTO. Validate every request again on the server with `contractSchema`, then enforce database state and role rules separately.

