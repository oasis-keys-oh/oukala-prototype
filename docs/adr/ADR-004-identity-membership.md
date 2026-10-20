# ADR-004: Identity and membership

An ADR (architecture decision record) states a design decision, its context, consequences and alternatives. This one is the **design half** of backlog item CL-63 (identity, membership and role model). The other half of CL-63, demonstrating one tenant at a time in the prototype, is separate work. This ADR carries no status or priority of its own; those live in the Product Backlog.

**Security review note.** This document is a requirement and a plan, not a claim that any control exists. It must be reviewed by a qualified security architect before any real customer data is stored (CL-70). It makes no certification claim (R52).

Date drafted: 2026-10-19. Rules: R12, R14, R44, R45, R51; parked rules R46 to R48 must not become impossible. Related: ADR-001 (isolation), ADR-002 (plan), ADR-003 (controls). Terms: IdP is an identity provider; SSO is single sign-on; OIDC is OpenID Connect; SAML is the Security Assertion Markup Language; SCIM is System for Cross-domain Identity Management; MFA is multi-factor authentication.

## 1. Context

Rule R44 says identity is separate from tenant: a person is one identity with one or more **memberships**, each in one tenant with its own roles; roles, permissions and approvals are evaluated per membership; default access is denied unless a rule allows it. Rule R45 says every request carries an explicit active tenant, writes target exactly one tenant, and switching tenants is an explicit, audited action that never merges two tenants' data in one write.

Why it matters: a consultant may be an employee of one tenant and an adviser to another; a managed service provider's staff will later serve many customers; a person must never see or write across tenants by accident.

Prototype fact (2026-10-19): there is no authentication. Demo personas and an "act as" switch exist (`GUARD.actAs`, `src/mod_r15f3_iam.js`), and a permission check `GUARD.can(user, action, resource)` is enforced on inbox decisions, budget edits, compensation reveal, timesheet approval, requisition approval, receipts and payment release. Roles and access reviews are shown on `adm_sec` and `r15_iam`. Tenants are four fictional demo scenarios switched by `SCN.set`, which also calls `DATA.setTenant`. All of this is **simulated**.

## 2. Decision

### 2.1 Model
| Concept | Definition |
|---|---|
| **Identity** | One human, known to the platform. It has no tenant. It is keyed by one or more links to identity providers, each (issuer, subject), never by email address. It holds only what is needed to authenticate and to recognize the person across their memberships |
| **Tenant** | One customer organization (ADR-001) |
| **Membership** | The link between one identity and one tenant, with its own status (invited, active, suspended, removed), kind (member, guest; later delegated), profile for that tenant (name shown, title, email used there), expiry (optional), and who granted it |
| **Role assignment** | Roles belong to a membership, drawn from the tenant's own role registry. The same person can be an approver in one tenant and read-only in another |
| **Permission set** | A named bundle of allowed actions on resource types, assigned to roles. Nothing is permitted unless a rule grants it (default deny) |
| **Group** | A tenant-defined set of memberships, used for assignment and approval routing (R14, R15) |
| **Non-human participants** | Agents and robots do not sign in. They run in exactly one tenant's context with a named human sponsor (R12, R22, R49). Their authority is a permission set on a service principal owned by that tenant, never an identity with memberships |
| **Staff grant** | Product-staff access to a tenant is a membership of kind "support grant": tenant-approved, time-boxed, scoped, audited, visible to the tenant administrator (R51). There is no standing global staff role over tenant data |

### 2.2 Requests and the active tenant (R45)
1. **Authentication is at identity level.** Signing in proves who the person is. It does not select a tenant.
2. **Every request names exactly one tenant** (in the request path or a header) and carries a token for it. The server checks that the identity has an **active membership** in that tenant, loads that membership's roles, and only then sets the tenant context that row-level security uses (ADR-001). A missing or unauthorized tenant fails closed.
3. **Tenant is never inferred from the last tenant used.** Defaults can pre-select a tenant in the interface, but the request still names it.
4. **Switching tenants is a token exchange**: the client asks for a token for another tenant; the server verifies membership, issues a short-lived tenant-scoped token, and writes an audit event with identity, from-tenant, to-tenant, time and device. The prior token is not valid for the new tenant.
5. **Writes target one tenant.** Operations that would touch two tenants are rejected. Any move of data between tenants is an explicit export and import with approval on both sides (R47), not a shared record.
6. **Interface behavior (R17):** switching keeps the screen and view and the user's own state (filters, tab) and replaces tenant state; the active tenant is always visible on screen.

### 2.3 Authorization (default deny)
- An evaluator answers `can(membership, action, resource)`. It denies unless a permission set, an ownership rule (for example "own record") or a group rule allows. The prototype's `GUARD.can(user, action, resource)` has the same shape, so the screens that call it today keep their call sites.
- **Separation of duties:** a requester cannot approve their own request (R14). Within a tenant the identity is the same actor. Two memberships of one identity in different tenants never combine; each is evaluated alone.
- **Approvals route to groups** that contain memberships, never to a named person (R14).
- **Access grants are time-boxed** (180 days, 90 for confidential or restricted data) and recertified on expiry (R14).
- **Evaluation inputs** always include the tenant and the membership; none of the checks read data from another tenant.

### 2.4 Sign-in and linking
- **Tenant-configured single sign-on.** A tenant may connect its own identity provider (OIDC or SAML), with provisioning through SCIM. A tenant-specific sign-in address resolves the tenant first ("home realm discovery"), then authenticates.
- **Just-in-time memberships** are created only when the tenant allows them and the verified email domain belongs to the tenant.
- **Account linking is explicit.** The platform does not merge two identities because they share an email address (a known account-takeover route). Linking requires the person to authenticate at both providers and confirm.
- **MFA** is required for all identities. Session length and re-authentication for sensitive actions are set by policy.

### 2.5 Membership lifecycle
Invite, accept, suspend, remove. Removing a membership ends access to that tenant immediately and revokes its tokens; the identity continues to exist with other memberships. An identity with no memberships can be deleted. Offboarding a tenant (ADR-003) removes its memberships and role assignments with its data.

### 2.6 Audit (R51)
Events recorded with both the actor's tenant and the target tenant: sign-in, failed sign-in, MFA events, tenant switch, membership change, role change, grant, staff access, token exchange failure. They appear in the tenant administrator's audit view (ADR-003).

## 3. Keeping the parked scenarios possible (R46 to R48)

Nothing built now should block these; the following design choices are made to keep them open:
1. **No tenant on the identity.** An identity never carries a home tenant, so the same identity can later hold memberships in a provider tenant and, by grant, delegated access in a customer tenant.
2. **Membership has a kind, scope, purpose, expiry and granted-by.** For now only member, guest and support-grant are used; the columns exist so a **cross-tenant grant** (R46) is just a membership of kind "delegated" created or approved by the data-owning tenant, with the grantee, entities or views, actions, purpose and an expiry (default 90 days), revocable at any time, visible to both sides.
3. **Authorization takes (identity, tenant, membership or grant).** A delegated membership flows through the same evaluator, so grants need no second authorization system.
4. **One active tenant per request stays true** even for portfolio views (R47). A managed service provider's all-customers dashboard is built by an aggregator that makes one authorized read per tenant under each tenant's grant, labels each result with its source tenant, and combines the results outside the databases. It is never a single query across tenants, which row-level security would reject anyway.
5. **Tenant relationships** (parent and child, provider and customer, deal room) are a separate relationship table that can be added without touching identity. A deal room (R48) is a space with its own membership list drawn from identities of two or more tenants, closed on a date, with data returned or deleted by policy.
6. **The audit schema separates actor tenant and target tenant**, so cross-tenant events are representable from the start.

## 4. Consequences

Positive:
- One person, one login, many tenants, with no data mixing and a clear audit trail.
- The tenant context for row-level security comes from a verified membership, tying ADR-001 to authentication.
- Per-membership roles let the same person hold different authority in different organizations.
- The parked cross-tenant scenarios become additive.

Costs and risks:
- Every request must carry and validate a tenant; clients and tools must handle tenant switching and token exchange.
- Tenant-scoped tokens add token management complexity.
- Per-membership profiles mean the same person can appear with different names or emails in different tenants; person search and Person 360 (R13) must be tenant-scoped and never join across tenants.
- Account linking needs a careful user experience to avoid duplicate identities.
- Configuring each tenant's identity provider adds support work.

## 5. Alternatives considered
| Alternative | Why not |
|---|---|
| Separate account per tenant, with no shared identity | Poor experience for consultants and providers; duplicates credentials; harder to audit one person across tenants |
| Tenant stored on the identity (one home tenant plus exceptions) | Makes parked scenarios harder; creates implicit access paths |
| Role on the identity rather than the membership | One role everywhere; wrong for a person with different authority in different tenants |
| Infer the active tenant from the last tenant used | Violates R45; causes wrong-tenant writes |
| Standing super-user access for staff | Violates R46 and R51 |
| Merge identities automatically by email | Account-takeover risk |
| Treat agents and robots as identities with memberships | They are participants with a human sponsor (R12, R22), not people who sign in |

## 6. How the prototype relates
- `SCN.set` and `DATA.setTenant` are the demo equivalent of the tenant switch; the prototype's `HOOKS` event `tenantChange` is the place a real switch will request a tenant-scoped token. It is **simulated**.
- `GUARD.can` and the "act as" switch are the demo equivalents of the evaluator and of a staff grant; the prototype's role registry and access reviews show how roles per membership will look.
- Rules R17 (seamless switching) and R18 (no leakage) are testable in the prototype now, but the security properties are provable only after ADR-002 steps 1 and 2.

## 7. Open points for the security architect
- Token format, lifetime and revocation approach.
- Home realm discovery design and tenant-specific sign-in addresses.
- Account linking and recovery flows.
- Session and re-authentication policy for sensitive actions.
- How staff grants are requested, approved by the tenant and expired.
