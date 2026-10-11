# Deployment paths and customer setup (Round 16)

Owner: Sam Patel. Backup: Jordan Lee. Decision record: D-R16-01. Screens: Implementation and setup, Deployment paths, Foundation data import, Data sources, Process guides, Tenant overlays (Admin and Platform groups). Edition names are working names (Core, Fabric, Fabric Enterprise).

## Answer

Do not clone a database for a new customer. Provision a tenant, run the same migration set, seed the base configuration (processes, roles, metrics, guardrails), then import that customer's own foundation data from the workbook and connect their sources. Cloning copies another customer's data, drifts from the migration history and cannot be audited. Provisioning from code is repeatable and testable.

Default path (D-R16-01): pooled SaaS with per-tenant schema and per-tenant encryption keys. Upgrade path: a dedicated stack in the vendor AWS organization for customers that need isolation. Priced add-on: a dedicated stack in the customer's AWS account. Exception only: private VPC or on-premises container install. All four use the same infrastructure-as-code modules, container images and migration set, so there is one product and one test matrix.

## Architecture

- Tenant boundary: tenant record, schema, key, subdomain, identity provider connection, region.
- Control plane (vendor): tenant registry, provisioning pipeline, edition and entitlement service, billing meter, support access with time-boxed grants.
- Data plane (per tenant or pooled): application services, database schema, object storage prefix, search index, secrets, event bus topics.
- Fabric: connectors run in the data plane of the tenant; credentials stay in the tenant key store.
- Promotion: dev, test, prod environments per edition; configuration (processes, overlays, roles) promotes as versioned bundles, data does not.

## Provisioning steps

1. Create the tenant record: name, edition, deployment model, region, residency, owner and backup.
2. Run the infrastructure module for the chosen model (pooled: schema, key, bucket prefix; dedicated: full stack).
3. Apply the migration set; verify the schema version matches the release.
4. Seed base configuration: roles, groups, base processes, metrics, guardrails, notification templates.
5. Connect the identity provider (SSO and SCIM) and map groups to roles.
6. Apply branding and theme; check contrast.
7. Import foundation workbook sheets in order; fix errors from the dry run; commit.
8. Register and test data sources; run the first sync (simulated in the prototype).
9. Configure overlays for this customer; approvals route to groups.
10. Review process guides; confirm readiness checks; sign off; schedule go-live and cutover; take a backup snapshot.

## Foundation data workbook

Eleven sheets: organization units, people, groups and memberships, roles, process owners, locations, vendors, systems and data sources, metrics targets, notification routes, policies. Each has a CSV template, example rows, enum lists and reference checks. The import wizard runs upload, column mapping, validation, dry run, error report and commit, with an audit entry and an event for every batch. Person records are classified personal; national identifiers are rejected by pattern.

## Configuring processes per customer

A customer override is a delta on a base process, not a copy. Operations: approval levels (nested, sequential, each level routes to a group), owner group, add or remove step, SLA, parameter. The effective process is the base plus the tenant's active overlay. Guardrails block unsafe changes (no empty gate, distinct groups per chain, segregation of duties, groups only, protected classes keep approvals, structure floor, SLA ceiling, parameter limits). An overlay is versioned, approved by the Process governance board plus class-specific groups (the proposer cannot approve), and can be promoted to base when several customers want it.

## Commercial packaging and selling motion

| Stage | Duration | Scope | Pricing | Exit criterion |
|---|---|---|---|---|
| Pilot | 4 to 6 weeks | Pooled sandbox, 1 to 2 processes, 25 to 100 users | Fixed fee, credited to year one | Signed charter with sponsor, owner, backup |
| Proof of value | 8 to 12 weeks | Production-like tenant, 3 to 5 processes, two connectors | Fixed fee plus pilot user rate | Agreed metrics met, readiness 80% |
| Rollout | 3 to 9 months in waves | All sheets, overlays, guides, SSO | Annual subscription by edition and users | Readiness 100%, review board sign-off per wave |
| Expand | Ongoing | More processes, connectors, agents, environments | Add-ons | Quarterly business review |

Pricing levers: edition, users, deployment model, connectors and run volume, environments, AI usage, support and services.

## Editions plan

| Edition | Connectors | Environments | Includes |
|---|---|---|---|
| Core | 3 | 1 | Platform-internal sync, file import, one identity provider |
| Fabric | 15 | 2 | Certified connectors, mapping studio, webhooks, dev plus prod |
| Fabric Enterprise | 60 | 5 | Change-data-capture, five environments, dedicated options |

## Decision D-R16-01 and risks

Consequences: one migration set; pooled to dedicated by restoring the tenant backup into a new stack; residency outside vendor regions needs the add-on; private installs need a separate support policy. Risks: noisy neighbor in pooled (mitigate with quotas), key management per tenant, support access for private installs. Open: final edition names and price points.

## Prototype limits

Connectors, provisioning and sync are simulated and labeled so. Overlays, imports, guides and readiness are real in the prototype store.
