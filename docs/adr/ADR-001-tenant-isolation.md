# ADR-001: Tenant isolation

An ADR (architecture decision record) states a design decision, the context it answers, its consequences and the alternatives considered. This one covers backlog item CL-62. It carries no status or priority of its own; those live in the Product Backlog.

**Security review note.** This document is a requirement and a plan, not a claim that any control exists. It must be reviewed by a qualified security architect before any real customer data is stored (CL-70, and decision 8 in `docs/PLATFORM_RULES.md`). It makes no certification claim (rule R52). The prototype is database-free, so everything described here is **simulated** in the prototype and unproven.

Date drafted: 2026-10-19. Related: ADR-002 (persistence and authentication plan), ADR-003 (tenant controls), ADR-004 (identity and membership). Rules: R16 to R20, R43 to R45, R49 to R52.

## 1. Context

Falconaire is to be a cloud-hosted software-as-a-service (SaaS) application where most customer organizations sign in to their own slice of data on the same application (Part 2, section D of the Platform Rules). A tenant is one customer organization. Every record belongs to exactly one tenant.

Decision 4 (Omar, 2026-10-19) set the isolation default: **a shared database with row-level security (RLS) per tenant, with a path to dedicated databases for customers who need them.** Decision 5 parked cross-tenant access (service providers, mergers and acquisitions, parent and child organizations); the design here must not make those impossible later (R46 to R48).

What exists today (prototype fact, 2026-10-19):
- There is no database and no sign-in. Sample data is in the page. Tenants are four fictional demo scenarios (`core` Meridian Standards Foundation, `health` Larkspur, `mining` Redstone, `storage` Corvane), switched by `SCN.set`.
- `DATA` in `src/platform.js` is a tenant-scoped data access layer (`DATA.get(entity,{tenant,where})`, `DATA.setTenant`) that returns an empty list and records a gap, never another tenant's rows (R18). It is the seam where a real data layer will plug in.
- Only some screens read through it. Journey maps, Org chart and Build list follow the tenant; most screens still show Meridian data (R16 gap).

The isolation model has to be right before data goes in, because changing it later means moving every customer's data.

## 2. Decision

Use a **pooled model**: one PostgreSQL database cluster per deployment region, one shared schema, and tenant isolation enforced by the database itself with RLS, plus tenant-scoped keys in every other store. Keep a documented path to move any tenant to its own database without changing application code.

### 2.1 Database (R43)
1. **Every tenant-owned table has a `tenant_id` column**, not null, and its primary key is `(tenant_id, id)`. Foreign keys between tenant-owned tables include `tenant_id`, so a row cannot reference another tenant's row even by mistake.
2. **RLS is enabled and forced on every such table** (forced, so the table owner is also subject to it). Policies compare `tenant_id` with the tenant for the current transaction, set by the data access layer with a transaction-local setting from the verified request context (ADR-004). If the setting is missing the policy returns no rows and permits no writes (fail closed).
3. **The application connects as a role that cannot bypass RLS** (not a superuser, not the table owner, no bypass attribute). Migrations run under a separate role that the application never uses.
4. **No path around the policy**: views are created so they run with the caller's rights; functions that run with their owner's rights are not used for tenant data unless reviewed individually; connection pooling must be in a mode where the transaction-local setting cannot leak between requests.
5. **Defense in depth**: the application also filters by tenant (R43 says application code is the second line, not the first), and every write checks that the tenant on the row equals the active tenant (R45).
6. **Automated checks**: a build check lists every table with a `tenant_id` and fails if RLS is not enabled and forced or a policy is missing; a leakage test (R18) creates two tenants, writes in each, and proves no read, search, export, error message or cache entry in one shows the other.

### 2.2 Tenant-scoped keys in every other store
| Store | Rule |
|---|---|
| Cache | Every key starts with the tenant id. Callers cannot build a key without supplying the tenant; the cache client wrapper rejects a key that does not carry the active tenant |
| Queues and background jobs | Every message carries the tenant id in its envelope. A worker sets the tenant context (the same transaction-local setting) before it touches the database. Per-tenant concurrency limits stop one tenant from starving others |
| Search | Every document carries the tenant id. The tenant filter is added on the server from the verified context, never taken from the client. A document without a tenant id is rejected at index time. Embeddings and vector indexes follow the same rule (R49) |
| File and object storage | Object keys start with `tenants/<tenant id>/`. Download links are issued by the server after an authorization check, are short-lived, and cover one object. Storage policies deny access across prefixes |
| Logs, metrics and traces | Log lines carry the tenant id so a tenant's support and audit queries are filterable. Metrics avoid per-tenant labels that would explode cardinality; per-tenant usage goes to a metering table |
| AI gateway | Prompts, retrieved documents, memory and logs are scoped to one tenant per call (R49). A model call outside the gateway is not allowed |
| Backups | A cluster backup holds all tenants. Restoring one tenant uses a per-tenant logical export, not a cluster restore (see ADR-003 for deletion and proof) |

### 2.3 Noisy neighbor controls
Per-tenant statement timeouts, connection limits, rate limits and storage quotas, with alerts when one tenant's share of load rises. These are also the signal for the move triggers below.

### 2.4 Path to dedicated databases
Isolation tiers, from the default to the strongest:

| Tier | Description | When |
|---|---|---|
| T1 Pooled (default) | Shared cluster and schema, RLS, tenant-scoped keys | Most customers |
| T2 Dedicated database | The tenant's rows live in their own database on the same or a separate server; same schema, same RLS policies kept as defense in depth | A move trigger (below) is met |
| T3 Dedicated cluster or account | The tenant has its own database server and storage account, optionally its own region and keys | Stronger contractual or residency needs |

How the path works without code changes:
- A **tenant routing table** maps tenant to connection target. The data access layer resolves the target per request. Because all code already goes through the layer (R16), moving a tenant is a data operation, not a code change.
- The **schema is identical** in every tier, so the same migrations apply everywhere. Migrations are written as expand then contract, so a move does not need a freeze across all tenants.
- **Move procedure (outline)**: copy the tenant's rows by `tenant_id` filter to the target, replicate changes, freeze writes for that tenant briefly, verify counts and checksums per table, switch the routing entry, keep the old rows read-only for a short window, then delete them with proof (ADR-003). Roll back by switching the routing entry back.
- The rest of the stores (cache, queue, search, files) already use tenant-scoped keys, so they follow the routing table too: a dedicated index or bucket per tenant at T2 and T3.

### 2.5 Triggers for moving a customer to a dedicated database
Any one of these, assessed with the security architect, moves a customer to T2 or T3. Numeric thresholds are placeholders (**hypothesis**) to be set with real load data; no price points are implied.
1. **Contract or regulation** requires physical separation, a named region where no pooled cluster exists, or customer-controlled keys beyond what pooled tiers offer.
2. **Size**: the tenant's storage, query load or connections exceed a set share of the cluster (placeholder: a fifth of capacity) or push other tenants' latency beyond their targets.
3. **Noisy neighbor**: repeated incidents where controls in 2.3 do not contain the effect.
4. **Different recovery objectives**: the tenant needs a recovery point or time objective different from the pool's, or point-in-time restore for that tenant alone.
5. **Custom change cadence**: the tenant needs different upgrade timing, extensions or settings from the pool.
6. **Security findings**: a review or incident shows pooled isolation is not acceptable for that data class.
7. **Exit planning**: the customer wants a clean extraction or handoff of its whole database.

## 3. Consequences

Positive:
- Strong default isolation enforced where the data lives, so an application bug does not by itself expose another tenant's rows.
- One schema and one operational footprint at the start; efficient for many small and medium tenants.
- The routing layer gives a real, testable path to dedicated databases without a rewrite.
- Keys and prefixes make leakage tests mechanical.

Costs and risks:
- **RLS is necessary but not sufficient.** Misconfiguration (a table without a policy, a bypass role, an owner-rights function, a view that ignores the policy, a pooled connection that keeps another request's setting) defeats it. The automated checks above are therefore part of the decision, not an extra.
- One failure domain: a bad migration, a runaway query or an outage affects every pooled tenant. Mitigations: expand and contract migrations, quotas, staged rollout, later splitting into cells (groups of tenants on separate clusters, which the routing table already supports).
- Per-tenant backup, restore and deletion are harder than with a database per tenant; they depend on the per-tenant export and purge procedures in ADR-003.
- Policy evaluation adds query cost; indexes must lead with `tenant_id`.
- Cross-tenant features (parked) must be built as explicit, granted, audited reads through a service, never as a cross-tenant query. The `tenant_id` on every row and the single active tenant per request (R45, ADR-004) keep that possible.
- Product-staff access to customer data is a tenant-approved, time-boxed grant, audited and visible to the tenant administrator (R51). Break-glass access needs its own design in the threat model (CL-70).

Not decided here: the threat model (CL-70), the exact cloud provider and managed database product, per-tenant encryption detail (ADR-003), and the identity model (ADR-004).

## 4. Alternatives considered

| Alternative | For | Against | Outcome |
|---|---|---|---|
| Database per tenant from day one | Strongest isolation; simple per-tenant backup, restore and deletion; easy to place by region | Operations and cost grow with tenant count; migrations run N times; slow onboarding; heavy for a pilot | Kept as the T2 destination, not the default |
| Schema per tenant in one database | Some separation; per-tenant objects | Migrations run per schema; catalog growth hurts at hundreds of tenants; isolation depends on search paths, not a policy; weaker than RLS for leak prevention | Rejected |
| Shared tables with application-level filtering only | Simplest | A single missed filter leaks data; violates R43 ("below the application") | Rejected |
| Separate deployment per tenant (single-tenant SaaS) | Maximum isolation | Highest operating burden; no shared improvement path; slow to ship fixes | Held for T3 only |
| Sharded cells from the start | Limits blast radius | Premature before there is load; adds routing complexity before it is needed | Planned evolution of the pool, enabled by the routing table |
| RLS enforced only through an object-relational mapper filter | Convenient | It is application code, not the database; bypassed by raw queries | Rejected |

## 5. How the prototype relates
- The prototype labels isolation as **simulated** (R52). It can show behavior (tenant switch, no leakage across screens) but cannot prove security.
- `DATA` in `src/platform.js` is the intended seam: when a real store exists, its `get`, `define` and `pack` calls are backed by the tenant-scoped layer described here. The `tenantChange` hook (`HOOKS`) is where a real switch would request a new tenant-scoped token (ADR-004).
- The tenant packs (DC-09) are the same path real customer data takes (R20), so they become the seed and import format.

## 6. Open points for the security architect
- Which managed PostgreSQL product and which controls it offers for RLS testing, per-tenant keys and logical replication.
- Connection pooling mode and how the tenant setting is guaranteed not to leak across requests.
- Break-glass and support access procedures.
- Whether T1 is acceptable for restricted data classes or needs T2 from the start.
