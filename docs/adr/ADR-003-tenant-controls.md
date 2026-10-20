# ADR-003: Tenant-level controls

An ADR (architecture decision record) states a design decision, its context, consequences and alternatives. This one covers backlog item CL-68 and rules R50 and R51. It carries no status or priority of its own; those live in the Product Backlog.

**Security review note.** This document is a requirement and a plan, not a claim that any control exists. It must be reviewed by a qualified security architect before any real customer data is stored (CL-70). It makes no certification or compliance claim (R30, R52); "proof" below means a technical evidence record the product produces, not an attestation by an outside party.

Date drafted: 2026-10-19. Depends on ADR-001 (isolation) and relates to ADR-004 (identity). Terms: KMS is a key management service; a KEK is a key-encryption key; a DEK is a data-encryption key; BYOK means bring your own key; RPO and RTO are recovery point and recovery time objectives; WORM means write once, read many.

## 1. Context

Rule R50 says encryption keys, retention, data location and deletion are tenant-level settings, and that tenant offboarding deletes or returns all of its data and proves it. Rule R51 says everything crossing a boundary is audited and visible to the tenant's administrator. ADR-001 chose a pooled database with row-level security and tenant-scoped keys in every store, with a path to dedicated databases. These controls sit on top of that choice.

Prototype fact (2026-10-19): the screens `adm_audit` (Audit and compliance), `adm_sec` (Security and access, including break-glass and access reviews), `adm_env` (Environments and releases) and `adm_meter` (Licensing and billing) exist, with sample data. They are **simulated**: nothing is encrypted, retained, located or deleted by them. This document defines what the real controls need, so the simulated screens can later be backed by real behavior.

## 2. Decision

Five controls are tenant-level settings with platform minimums. A tenant's administrator can see them and, where allowed, change them; changes are audited.

### 2.1 Per-tenant keys
- **Envelope encryption with a key hierarchy per tenant.** A tenant master key (KEK) is held in a KMS. Data-encryption keys (DEKs) are generated per tenant and per data class (for example records, files, chat, agent memory) and stored wrapped by the KEK. Rows and objects store the key identifier they were encrypted with.
- **What is encrypted at the application layer per tenant:** designated sensitive columns, all uploaded files and exports, chat content, agent memory and embeddings where feasible. In a pooled database, storage-level encryption is platform-wide; per-tenant keys therefore need application-layer encryption, and that is the reason this is a separate decision.
- **Rotation:** scheduled and on demand. Rotating the KEK rewraps DEKs without re-encrypting data; rotating a DEK applies to new writes and a background re-encryption job.
- **Revocation and crypto-shredding:** destroying a tenant's KEK makes its encrypted data unreadable, including in backups. This is a primary deletion mechanism (2.4).
- **BYOK tier:** for tenants that need it, the KEK lives in the customer's own KMS and the platform is granted use of it. Revoking the grant stops all decryption and is audited. Availability trade-offs (a revoked or unavailable customer key stops the service for that tenant) must be shown to the customer before they choose it.
- **Isolation tier link:** at tiers T2 and T3 (ADR-001) the tenant's database can also have its own storage-level key.
- **Key use is audited** (creation, rotation, use at a summary level, revocation, destruction) and visible in the admin audit view.

### 2.2 Retention
- **Per-tenant retention policy by data class**: operational records, files, chat, agent logs and prompts, audit events, exports, backups.
- **Platform bounds:** a minimum for audit events and security logs (cannot be shortened by the tenant), a maximum for personal data in logs, and legal-hold override. Numeric values are placeholders to be set with counsel and the security architect (**hypothesis**).
- **Mechanics:** policies are data. A scheduled job finds expired items by class and removes them through the same purge handlers used for deletion (2.4). Each run writes an audit event with counts. A legal hold on a tenant, record or case suspends purging and is itself audited.
- **Backups:** retention of backups is a platform setting with a published window; items deleted by policy leave backups when the backup cycle expires, and the deletion record states this honestly.

### 2.3 Data location
- **Region chosen at onboarding.** Each tenant has a home region. Primary data, replicas and backups stay in the home region or in a named paired region inside the same legal jurisdiction.
- **Everything with tenant content follows the region**: database, files, search indexes, queues, caches that hold content, logs that include content, exports, and **calls to language models through the AI gateway** (R49). A model provider that cannot honor the region cannot be used for that tenant.
- **Support access location** is part of the policy: staff access from outside the home region needs the same tenant-approved grant as any support access (R51), and the audit record says where it occurred.
- **Changing region** is a controlled migration (the same procedure as the move to a dedicated database in ADR-001), not a setting flip.
- **Sub-processors** that touch tenant data are listed and visible to the tenant.

### 2.4 Deletion
- **Record level:** deletion is a soft delete with a short recovery window, then a purge. The purge cascades through every store that holds a derived copy: database rows, search documents, vector embeddings, cache entries, object storage, queued messages, agent memory.
- **Registry contract:** every datastore used by the platform registers a **tenant purge handler** with the platform. A new store cannot be released without one. This is how deletion stays complete as the system grows.
- **Tenant level:** deleting a tenant removes all rows by tenant identifier, all objects under the tenant prefix, all index documents, queue messages and cache keys, and destroys the tenant's keys.
- **Subject level:** a request to delete a person's data runs the same cascade scoped to that person where the law and the retention policy allow, and records any exception (for example audit events that must remain).
- **Backups:** deleted data leaves backups at expiry; with the tenant's keys destroyed, backup copies of its encrypted data are unreadable earlier.

### 2.5 Offboarding with proof
Stages, with each transition audited:
1. **Notice and scoping:** the tenant administrator and the platform agree on the exit, including what is exported.
2. **Export:** complete data in open formats (tables as CSV or JSON with a schema description, files as is, audit log as export), delivered through a time-limited link, with a manifest and checksums. Export also covers the tenant's configuration (processes, metrics, vocabulary), so it is portable.
3. **Freeze:** the tenant becomes read-only and sign-in is limited to export and audit access.
4. **Grace period:** a stated window (placeholder: 30 days, **hypothesis**) for the customer to verify and for any dispute.
5. **Purge:** the purge handlers of every registered store run for the tenant; keys are destroyed (crypto-shred).
6. **Proof:** the platform generates a **deletion record**: a manifest listing every registered store, the count of items before and after (zero), the time of each step, the key-destruction event, and a hash of the manifest. The hash is written to the append-only audit log (2.6) and the record is delivered to the tenant administrator. A verification job re-checks after a delay that no row, object, index document or key remains. The record states what remains and why, for example "backups expire on <date>" and any retained audit events.
7. **Limits stated plainly:** the record is a technical evidence record produced by the platform. It is not an independent audit, and no certification is implied.

If any registered store fails to confirm its purge, the process stays open and the tenant administrator is told. It never reports success on partial data.

### 2.6 Admin audit view (R51)
A tenant administrator sees, filtered to that tenant only:
- sign-ins, failed sign-ins, tenant switches (ADR-004), role and membership changes;
- exports and downloads of bulk data;
- grants of access, including **product-staff and support access** (each needs a tenant-approved, time-boxed grant and shows who, why, scope, start and end);
- cross-tenant reads and grants, when that parked scenario exists (R46 to R48);
- key events (rotation, BYOK grant or revocation, destruction);
- retention and location setting changes, legal holds, deletion and offboarding stages;
- agent and robot actions that cross a boundary, with the sponsor.

Properties required of the audit log itself:
- **Append-only and tamper-evident:** each event carries a hash of the previous event (a chain), and periodic checkpoints are written to storage that cannot be altered (WORM).
- **Complete fields:** actor, actor's tenant, target tenant, action, object, time, source address or device, result, reason, and request identifier.
- **Separate from the data it audits:** a tenant cannot edit or delete its own audit events inside the retention minimum.
- **Exportable** to the tenant's own monitoring system.
- **Platform-level audit** (staff actions across the whole service) is separate and not visible to tenants except for events about their own data.

## 3. Consequences

Positive:
- Gives the tenant real, inspectable control and a deletion record it can show its own auditors.
- Key destruction gives a strong, fast deletion mechanism that also covers backups.
- The purge registry keeps deletion complete as stores are added.

Costs and risks:
- Application-layer per-tenant encryption limits what the database can index or search on encrypted columns; designs must choose which fields need it.
- BYOK adds an availability dependency on the customer's key service.
- Region-bound AI calls restrict model choice (ADR-002, step 6).
- Complete purge across backups is bounded by backup cycles; the proof must say so.
- The audit log grows quickly; its own retention and cost need planning.
- Per-tenant exports and purges must be tested on every release, not once.

## 4. Alternatives considered
| Alternative | Why not chosen |
|---|---|
| One platform-wide key for everything | Cannot satisfy R50; no crypto-shredding per tenant |
| Keys only at the database-storage level | Not per tenant in a pooled model |
| Database per tenant to make keys, deletion and location simple | Kept for tiers T2 and T3 (ADR-001); too heavy as the default |
| Deletion by manual runbook | Incomplete as stores are added; no machine-checkable proof |
| Deletion proof as a plain statement | Not verifiable; the registry-and-manifest approach is |
| Tenant-editable audit log | Defeats its purpose |

## 5. How the prototype relates
- `adm_audit` and `adm_sec` can later host the admin audit view and the grant list; today they show sample events. They stay labeled simulated (R29, R52).
- The prototype's audit calls (`audit(...)`) are the places real events will be emitted.
- `adm_env` and the deployment paths document (`docs/DEPLOYMENT_PATHS_R16.md`) are the place to describe regions and environments once real.

## 6. Open points for the security architect and counsel
- Which fields and files need application-layer encryption, and the search trade-offs.
- Key management service product, rotation periods, BYOK supported clouds.
- Retention minimums and maximums by data class and jurisdiction.
- Backup window and the exact wording of the deletion record.
- Whether an independent attestation of deletion is offered later (no claim is made now).
