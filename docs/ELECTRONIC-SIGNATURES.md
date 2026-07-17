# Electronic-signature provider integration

The built-in electronic signature workflow demonstrates document review, separate signer confirmations, typed/drawn/uploaded signatures, timestamps, time zone, attribution fields, hashes, versions, and audit events. An operational external-signing system should connect a verified provider or an equivalently secured server-side workflow.

## Provider adapter

Implement a server-only adapter with these operations:

```ts
interface ESignProvider {
  createEnvelope(input: CreateEnvelopeInput): Promise<{ envelopeId: string }>;
  createRecipientLink(envelopeId: string, recipientId: string): Promise<{ url: string; expiresAt: string }>;
  getEnvelope(envelopeId: string): Promise<EnvelopeStatus>;
  downloadSignedPdf(envelopeId: string): Promise<ArrayBuffer>;
  downloadCompletionCertificate(envelopeId: string): Promise<ArrayBuffer>;
  verifyWebhook(rawBody: Uint8Array, signature: string): WebhookEvent;
}
```

Keep provider API keys and webhook secrets server-side. Do not import them into client components or expose them through `NEXT_PUBLIC_` variables.

## Envelope creation

Before creating an envelope:

1. Validate the full contract and legal-advice acknowledgment.
2. Render the canonical PDF containing page one, every legal-terms page, and exhibits.
3. Compute its SHA-256 hash.
4. Lock the source version.
5. Create recipient records for the Property Owner/Lessor and Renter.
6. Map each recipient to printed name, title, organization, email, signature, and date tabs.
7. Require the same separate signer confirmations used by the in-app workflow, either in the provider or immediately before embedded signing.
8. Store the provider envelope ID and exact document hash.

Never let a provider template silently replace or omit universal clauses.

## Identity and consent

Use verified email, a one-time passcode, or a provider-supported identity check appropriate to risk and law. Record the selected method without claiming that any one factor guarantees enforceability. Capture IP addresses only when counsel and privacy policy approve it; disclose the collection, restrict access, and define retention.

## Webhooks

Verify every webhook against the raw request body, reject replayed event IDs, and process events idempotently. On completion:

- fetch status directly from the provider;
- download the signed PDF and completion certificate over the provider API;
- compute hashes for both files;
- compare the provider’s source-document fingerprint when available;
- store files in private immutable paths;
- insert audit events in one transaction;
- mark the agreement fully executed and locked;
- email authenticated or expiring download links to all parties.

Do not trust a browser redirect alone as proof that signing completed.

## Hybrid and wet-ink workflows

For hybrid execution, retain the electronically signed counterpart and uploaded wet-ink counterpart as separate originals, then create a final document package and completion record that identifies both. For fully wet-ink execution, preserve the unsigned generated version, uploaded signed scan, upload hash, uploader, timestamp, administrator execution decision, and final locked version.

## Provider evaluation checklist

Confirm support for embedded or remote signing, recipient authentication, tamper-evident source documents, raw webhook verification, signed-PDF retrieval, completion certificates, audit exports, data residency, a usable signing experience, retention controls, organization-level access, and deletion/legal-hold policies. Have counsel review the complete workflow for each jurisdiction and property use.
