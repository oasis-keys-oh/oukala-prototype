# 13. Setup and deployment path

A new customer gets a provisioned tenant, the same migration set as every other customer, a seeded base configuration and their own foundation data loaded from a workbook; nobody clones another customer's database.

This section answers three questions: how the product is sold, how a tenant is set up step by step, and how it is kept current afterwards. It reuses the facts in docs/DEPLOYMENT_PATHS_R16.md (decision D-R16-01) and the live build out_v16b. Section 14 gives the architecture behind each step.

## 13.1 The direct answer

| Question | Answer |
|---|---|
| Provision a new stack in AWS for each customer? | Not by default. Default is pooled SaaS: a new schema and a new encryption key in the shared stack. A dedicated stack in the vendor AWS organization is the upgrade path for isolation. A stack in the customer's own AWS account is a priced add-on. |
| Clone my database? | No. A clone copies another customer's data, drifts from the migration history and cannot be audited. Provision from code, run the migration set, seed base configuration, import the customer's own data. |
| Install things locally? | Exception only: a private VPC or on-premises container install, with a separate support policy. |
| What keeps four paths manageable? | One set of infrastructure-as-code modules, one set of container images, one migration set, one test matrix. |

## 13.2 Deployment paths

| Path | Isolation | Operated by | When to choose | Pricing treatment |
|---|---|---|---|---|
| Pooled SaaS (default) | Per-tenant schema and key; quotas | Vendor | Most midsize customers; pilots and proofs of value | Subscription by edition and users |
| Dedicated stack, vendor AWS organization | Own VPC, database cluster, keys | Vendor | Isolation, noisy-neighbor concerns, specific region | Premium on subscription |
| Dedicated stack, customer AWS account | Customer owns the account; vendor uses just-in-time access | Vendor with customer controls | Procurement or regulator requires customer account | Priced add-on |
| Private VPC or on-premises container install | Customer environment | Customer, vendor supports | Exception only | Separate license and support policy |

Consequences recorded in D-R16-01: one migration set; pooled to dedicated by restoring the tenant backup into a new stack; residency outside vendor regions needs the add-on; private installs need a separate support policy. Risks: noisy neighbor in pooled (mitigate with quotas), key management per tenant, support access for private installs.

## 13.3 Selling motion

Pilot, proof of value, rollout, expand. Each stage has a fixed scope and one exit criterion that releases the next commercial step.

| Stage | Duration | Scope | Pricing | Exit criterion |
|---|---|---|---|---|
| Pilot | 4 to 6 weeks | Pooled sandbox, 1 to 2 processes, 25 to 100 users | Fixed fee, credited to year one | Signed charter with sponsor, owner, backup |
| Proof of value | 8 to 12 weeks | Production-like tenant, 3 to 5 processes, two connectors | Fixed fee plus pilot user rate | Agreed metrics met, readiness 80 percent |
| Rollout | 3 to 9 months in waves | All sheets, overlays, guides, SSO | Annual subscription by edition and users | Readiness 100 percent, review board sign-off per wave |
| Expand | Ongoing | More processes, connectors, agents, environments | Add-ons | Quarterly business review |

Selling guidance:

1. Lead with the closed loop the prototype demonstrates: a process, its data, its metrics, its owner and its connections in one place, with every approval routed to a group.
2. Pilot with two processes the buyer already complains about (for example change approval and a request fulfilment flow) so value shows in weeks.
3. The proof of value charter names metrics up front, with baseline, target and owner for each. The platform's own metrics (381 in the prototype) supply the definitions.
4. Use the first customer, a sample standards foundation, as the reference. Its processes arrive as process content; the product never carries its professional-standards vocabulary into product text.
5. Show the cost of the alternative: the fabric, governance, agent guardrails and BC/DR modules replace several point tools.
6. Every stage ends with a go or no-go review owned by a named sponsor and the vendor engagement lead.

Pilot to rollout checklist: sponsor and backup named; success metrics agreed; identity provider access confirmed; first foundation sheets loaded; two connectors scheduled; approver groups populated; readiness at or above the stage threshold.

## 13.4 Editions and entitlements

Edition names are working names (Core, Fabric, Fabric Enterprise). The decisions log says not to use them externally until naming is settled; see D-07 and D-08 in section 16.

| Edition | Connectors | Environments | Includes |
|---|---|---|---|
| Core | 3 | 1 | Platform-internal sync, file import, one identity provider |
| Fabric | 15 | 2 | Certified connectors, mapping studio, webhooks, dev plus prod |
| Fabric Enterprise | 60 | 5 | Change-data-capture, five environments, dedicated options |

Entitlement mechanics:

1. A license key or edition switch in Licensing and billing unlocks the fabric. The screens exist for every edition.
2. Locked areas show a working preview with seeded data, a banner stating what unlocks and the current limit, and a request-unlock action that opens a normal approval.
3. Limits are metered through the usage service: runs, records, connectors, environments, users, agent spend.
4. A downgrade freezes new runs but keeps read access, history and lineage.
5. Enforcement is server side: the entitlement service issues signed claims that the application checks. A client-side switch is never the control.

Freshness by edition: Core batch only; Fabric adds webhooks and event streams; Fabric Enterprise adds change-data-capture and low-latency SLAs.

## 13.5 Pricing levers

At the level the project documents allow, price points are not set. Final edition names and price points are open (D-07).

| Lever | What varies | Notes |
|---|---|---|
| Edition | Core, Fabric, Fabric Enterprise | Sets connector, environment and feature limits |
| Users | Named users by tier (full, light, requester-only, vendor guest) | Requester-only users make service portals affordable at thousands of users |
| Deployment model | Pooled, dedicated vendor AWS, dedicated customer AWS, private | Premium for isolation; add-on for customer account |
| Connectors and run volume | Count of certified connectors; runs and records per month | Metered; overage tiers |
| Environments | Dev, test, prod, sandboxes | Edition includes 1, 2 or 5 |
| AI usage | Tokens and agent runs through the gateway | Included allowance, then metered or customer-supplied model keys |
| Support and services | Support tier, implementation services, hypercare | Fixed-fee pilot and proof of value |

Cost floor for planning (approximate, from section 14.24): a pooled tenant costs the vendor about 1,000 to 3,400 dollars per month all in at midsize scale; a dedicated vendor-account stack about 6,500 to 14,500. Pricing should clear these with a margin that also covers support and services.

## 13.6 Tenant provisioning runbook

Owner: Sam Patel (prototype persona), backup Jordan Lee. In production these are the named delivery lead and backup on the tenant record. Each step has an owner, a check and an audit event. Steps follow the prototype's setup screens (Implementation and setup, Deployment paths, Foundation data import, Data sources, Process guides, Tenant overlays).

| # | Step | Actor | Action | Check before moving on |
|---|---|---|---|---|
| 1 | Create the tenant record | Control plane operator | Name, edition, deployment model, region, residency, owner and backup, subdomain | Record exists; owner and backup are different people |
| 2 | Create keys | Provisioning pipeline | Create the tenant master key in KMS; create the data key; record key id | Key policy reviewed; rotation set |
| 3 | Run the infrastructure module | Provisioning pipeline | Pooled: schema, role, bucket prefix, topic prefix, quotas. Dedicated: full stack module | Plan reviewed; apply succeeds; health check green |
| 4 | Apply the migration set | Provisioning pipeline | Run versioned migrations | Schema version equals the release version |
| 5 | Seed base configuration | Provisioning pipeline | Roles, groups, base processes (246 in the library), workflows (311 definitions), metrics (381), guardrails GR-01 to GR-08, notification templates, permission rules (222), registry entities | Seed checksum matches release; unclassified field count is zero |
| 6 | Connect identity | Customer identity admin with delivery lead | OIDC or SAML connection; SCIM; map groups to roles | Test sign-in; test provisioning of three sample users; role mapping reviewed |
| 7 | Roles and permissions | Customer security lead | Confirm role mapping; review permission rules; segregation-of-duties checks clear; turn enforcement on | Policy simulation shows no unintended access; enforcement on |
| 8 | Branding and theme | Customer communications owner | Name, accent color, mode | Contrast check passes so text stays readable |
| 9 | Foundation data load | Customer data owner | Import workbook sheets in order (13.7): upload, mapping, validation, dry run, error report, commit | Zero errors on dry run; commit audit entry and event per batch |
| 10 | Register data sources | Customer integration owner | Register sources with type, direction, schedule, owner, backup, field mapping; test connection; first sync | Each source has an owner and backup; first sync reconciles |
| 11 | Configure processes | Process owners | Apply tenant overlays on base processes (13.8); approvals route to groups | Guardrails pass; overlay approved by the Process governance board |
| 12 | Review process guides and readiness | Delivery lead | Confirm readiness checks, review guides | Readiness meets the stage threshold (80 percent proof of value, 100 percent rollout) |
| 13 | Go-live sign-off | Architecture review board | Backup snapshot taken and restore tested; rollback plan; hypercare roster; cutover runbook | Signed off |
| 14 | Go-live and cutover | Delivery lead | Schedule cutover, announce, switch traffic, monitor | SLOs met for the hypercare window |

Rollback: until step 14, a tenant can be torn down and recreated from code. After go-live, rollback is a point-in-time restore plus the cutover runbook.

Prototype limits: connectors, provisioning and sync are simulated and labeled so. Overlays, imports, guides and readiness are real in the prototype store. Production replaces the simulated parts with the pipeline in section 14.

## 13.7 Foundation data workbook

The workbook has eleven sheets. The live build (out_v16b, template R16M.TPL) defines the sheets, load order and required columns below. Each sheet has a CSV template, example rows, enum lists and reference checks. Docs/DEPLOYMENT_PATHS_R16.md lists a slightly different set of eleven names (locations, roles, metrics targets, notification routes and policies instead of cost centers, service catalog, CMDB items, applications and budget lines); the live build wins and the difference is a decision (D-14).

| Order | Sheet | Entity | Key | Depends on | Required columns |
|---|---|---|---|---|---|
| 1 | Org units | organization_unit | org_unit_id | none | org_unit_id, name |
| 2 | People | person | email | Org units | email, name, org_unit_id, employment_type |
| 3 | Groups and roles | role | group_id | People | group_id, name, kind, owner_email, backup_email |
| 4 | Cost centers | cost_center | cost_center_id | Org units, People | cost_center_id, name, owner_email, backup_email |
| 5 | Vendors and contracts | core_company | contract_id | People | vendor_id, vendor_name, contract_id, start_date, end_date, owner_email, backup_email |
| 6 | Service catalog | catalog_item | item_id | Groups and roles | item_id, name, kind, owner_email, backup_email |
| 7 | Configuration items | cmdb_ci | ci_id | Groups and roles, Service catalog | ci_id, name, ci_class, owner, support_group |
| 8 | Applications | application | app_id | People, Vendors and contracts | app_id, name, tier, owner_email, backup_email |
| 9 | Process owners | process_definition | process_id | People | process_id, owner_email, backup_email |
| 10 | Budget lines | budget_line | line_id | Cost centers, Vendors and contracts | line_id, name, cost_center_id, fiscal_year, amount, owner_email, backup_email |
| 11 | Data sources | connector | source_id | People | source_id, name, system_type, direction, owner_email, backup_email |

Load order is the dependency order: a sheet cannot commit before the sheets it references are committed or included in the same batch.

Validation rules (implemented in the prototype validator and carried to the production pipeline):

1. Required: every required column must be mapped and non-empty.
2. Type: email format, date as YYYY-MM-DD, number, yes/no boolean.
3. Enum: value must be in the list (for example employment type: Employee, Contractor, Managed service provider; unit type: Division, Department, Team).
4. Reference: a referenced key must exist in committed data or in the same file (manager, org unit, cost center, vendor, group).
5. Uniqueness: duplicate keys within the file or against committed data are errors.
6. Restricted pattern: any value that looks like a national identifier is an error; the file is rejected until it is removed.
7. Classification: columns holding personal data (email, name, manager email) are tagged personal on load.
8. Owner and backup: owner and backup must be different people who resolve in the People sheet. A missing backup shows a "No backup" badge, not a silent default.
9. AI agents are not loaded here; they register separately with a human sponsor.
10. Dry run produces an error report (row, column, rule, severity); commit stays disabled while any error remains.
11. Every committed batch writes an audit entry and an `import.committed` event.

Re-running a sheet updates by key; it never duplicates.

## 13.8 Process configuration with tenant overlays

A customer override is a delta on a base process, not a copy. The effective process is the base plus the tenant's active overlay, resolved when an instance starts.

Operations an overlay may contain: approval levels (nested, sequential; each level routes to a group), owner group, add or remove a step, SLA, parameter.

Examples from the prototype (the screen shows Customer A approving once at step 4 and Customer B approving twice at step 5 after an added security review; the base process and group names below are illustrative):

| Tenant | Base process | Overlay | Resulting behavior |
|---|---|---|---|
| Customer A | Base process with an approval gate (for example change approval) | One approval level at step 4, routed to the Change advisory board group | A change reaches implementation after a single group approval |
| Customer B | Same base process | Security review step added before approval; two approval levels at step 5, routed to the Change advisory board group then the Architecture and security review group | A change needs the security review, then two sequential group approvals |

The prototype's sample tenants for these are Cascade Regional Health (Customer A) and Summit Credit Union (Customer B).

Guardrails (every overlay is checked; errors block):

| Rule | Name | Effect |
|---|---|---|
| GR-01 | A gate keeps at least one approval level | Removing every approval from a gate is never allowed |
| GR-02 | Levels in one gate use distinct groups | A chain cannot use the same group twice |
| GR-03 | Segregation of duties | The requester cannot sit in the approving group for the same record |
| GR-04 | Groups only | Approvals route to groups, never to individuals |
| GR-05 | Protected classes keep their approvals | Defined classes (for example emergency change, financial release) cannot lose their approval |
| GR-06 | Structure floor | A process keeps its minimum structure |
| GR-07 | SLA ceiling | An SLA cannot be relaxed beyond the ceiling |
| GR-08 | Parameter limits | Parameters stay inside declared ranges |

Governance:

1. An overlay is versioned. It is approved by the Process governance board plus class-specific groups. The proposer cannot approve.
2. A draft can be simulated against sample records before approval.
3. When several customers want the same overlay, it can be promoted to base through the normal release path.
4. In production an overlay is a signed, versioned bundle in the tenant configuration store. In-flight instances keep the version they started on.

## 13.9 Upgrade and release policy

| Topic | Policy |
|---|---|
| Release cadence | Application releases every two weeks to pooled tenants; content (process library, metrics, templates) monthly; security fixes out of band |
| Versioning | Semantic versions for the product, the API, entities, manifests and mappings; version format follows the registry |
| Rollout | Ring 0 internal tenant, ring 1 pilot tenants, ring 2 pooled tenants in batches, ring 3 dedicated tenants in their change windows |
| Notice | Release notes 5 business days ahead; breaking changes need a deprecation window of at least 6 months with impact analysis per tenant |
| Configuration promotion | Dev to test to prod as versioned bundles; data does not promote |
| Customer control | Dedicated and customer-account tenants choose a window; pooled tenants get a pause option for freeze periods up to 30 days except security fixes |
| Migrations | Forward-only, expand-and-contract; every migration tested on representative data |
| Rollback | Application rollback by blue/green; data rollback only by point-in-time restore; flags disable features immediately |
| Private installs | Quarterly release bundles with a defined support window of two releases |
| Overlay compatibility | Each release runs an overlay compatibility check against every tenant; incompatible overlays block that tenant's upgrade and open a work item for the owner |

Approximate durations are targets, not commitments, until confirmed in the support contract.

## 13.10 Support model

| Tier | Scope | Channel | Response target (approximate, to be confirmed) |
|---|---|---|---|
| Customer platform admin | First line inside the customer: configuration, users, groups, overlays | Service portal | Customer-defined |
| Vendor support level 1 | How-to, access, known issues | Portal, email | Business hours; severity 1 within 1 hour at premium |
| Vendor support level 2 | Defects, integration faults, data issues | Portal, phone for severity 1 | Severity 1 within 1 hour, severity 2 within 4 hours |
| Vendor engineering | Root cause, fixes, hot patches | Escalation | Per severity |
| Customer success | Adoption, quarterly business review, expand plan | Scheduled | Quarterly |

Rules:

1. Vendor staff access to a tenant requires a time-boxed grant that the customer sees; every action is audited. No standing access.
2. Support runs on the product itself: tickets, knowledge, SLAs and problem records for each tenant live in a vendor tenant of the same product.
3. Private installs have a separate support policy: remote diagnostics by customer-initiated export only, longer targets.
4. Each tenant has a named vendor engagement lead and backup, and a named customer owner and backup.
5. Severity definitions match the product's priority engine (impact and urgency).

Register filter: layer = delivery; type in (PROC, COMM, OPS, DATA, SUPPORT); entities in (tenant, edition, entitlement, import_batch, overlay).

Decisions needed: D-01 hosting default; D-07 pricing and editions; D-08 product name; D-14 foundation workbook sheet set; D-15 vendor operating model and support hours; D-16 first customer commercial terms (all detailed in section 16).
