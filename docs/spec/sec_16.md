# 16. Open decisions and risks

Twenty-four decisions and fourteen product risks are open; each decision has a recommendation, a named owner role and a date by which the build needs it.

Decision ids D-01 to D-24 are referenced from sections 13, 14 and 15. "Needed by" uses build day numbers from section 15.6 (day 0 is the day the build starts) or a named gate. Owners are roles; the named human owner and backup are recorded in the register per Feature Contract rule 5.

## 16.1 Decisions needed

| ID | Decision | Options | Recommendation | Owner | Needed by |
|---|---|---|---|---|---|
| D-01 | Hosting default and cloud | (a) Pooled SaaS on AWS with per-tenant schema and key; (b) dedicated stack per customer; (c) multi-cloud from the start | (a), as recorded in D-R16-01; dedicated vendor AWS as upgrade, customer AWS as add-on, private install as exception; confirm AWS as the only cloud for the first year, keep the stack container-based for portability | Product owner with tech lead | Day 10 |
| D-02 | System of record database | PostgreSQL with row-level security, MySQL, SQL Server, distributed SQL, key-value, document | PostgreSQL 16 or later (Aurora/RDS on AWS, container elsewhere); revisit distributed SQL only if one tenant exceeds about 50 million rows in a hot table | Tech lead | Day 10 |
| D-03 | Workflow engine | Temporal, Step Functions, in-house on PostgreSQL | In-house behind a `WorkflowEngine` port for the first release; formal review at end of phase 3; Temporal is the fallback executor | Tech lead | Day 30 (review at phase 3 exit) |
| D-04 | Policy engine | Native evaluator, OPA, Cedar, relationship store | Native evaluator with policy format compatible with OPA and Cedar (decision of record); evaluate Cedar in phase 2 on the 222 ported rules plus a generated test set | Security lead | Day 45 |
| D-05 | Search | PostgreSQL full text plus trigram plus pgvector, OpenSearch, vector database | PostgreSQL first; add OpenSearch per tenant when searchable documents exceed about 10 million or faceted search is required | Tech lead | Day 60 |
| D-06 | Model providers | Single frontier provider, multiple frontier providers through a gateway, open-weight models self-hosted | Frontier models first through an own thin gateway with adapters for at least two providers; self-hosted models only for private installs; no training on tenant data by contract; Perplexity-style research sources as governed sources later | Product owner with security lead | Day 60 |
| D-07 | Pricing and editions | Keep Core, Fabric, Fabric Enterprise as working names; rename; per-user, per-connector, or platform fee plus usage | Test per-connector tier plus run volume plus an enterprise platform fee (from the fabric evaluation); user tiers (full, light, requester-only); do not use the working edition names externally until naming is settled; set price points only after a priced bill of materials (section 14.24) | Product owner | Before first pilot proposal |
| D-08 | Product name | Trellis (rejected: used by legal software and registered marks), candidate names under evaluation, keep the working name Oukala for the platform brand | Hold the current working name in one configuration value; shortlist three candidates, run clearance on each before choosing; no rename in identifiers | Product owner | Before first external demo |
| D-09 | Trademark search | Professional clearance search, attorney opinion, self-search only | Professional clearance search and attorney review for the top candidate in the relevant classes (software as a service, business management software), then filing; budget approximately a few thousand dollars per candidate (approximate) | Product owner with counsel | Before name decision |
| D-10 | Compensation, benefits, PTO and health-like data handling | (a) Do not store; (b) store as restricted with field encryption and tight rules; (c) store only references to the HR system | (c) by default for compensation and benefits (HRIS stays authority, platform mirrors only what a process needs, masked); PTO balances and requests stored as personal with entity rules; health-like data (accommodations, leave reasons, wellness) not stored in the first release; any field kept is restricted, application-level encrypted, never embedded or sent to models, every reveal logged | Security lead with People Operations owner | Day 30 (before the person entity freezes) |
| D-11 | Framework acronym for BETH3 plus data | BETH3D, BETH3-D, BETH4 (replace), new name | BETH3D (Buildings, Equipment, Technology, Human resources, Third parties, Data) as proposed in the prototype; confirm spelling and publish a one-page definition; avoid a hyphen in identifiers | Product owner | Day 30 |
| D-12 | Event broker | Postgres outbox with LISTEN/NOTIFY, SQS and SNS (or EventBridge), Kafka, NATS | Outbox port with two adapters: Postgres-native first, SQS/SNS when external fan-out is needed | Tech lead | Day 30 |
| D-13 | API style | REST only; REST plus GraphQL read model; tRPC; gRPC | REST (OpenAPI generated from the registry) for writes and public reads; GraphQL as read-only composition for the web client; no tRPC in the public surface | Tech lead | Day 20 |
| D-14 | Foundation workbook sheet set | Live build's 11 sheets (org units, people, groups and roles, cost centers, vendors and contracts, service catalog, configuration items, applications, process owners, budget lines, data sources); the 11 listed in the deployment paths document (adds locations, roles, metrics targets, notification routes, policies) | Union is 15 to 16 sheets; keep 11 as the required core and make locations, metrics targets, notification routes and policies optional sheets in release 1; update the deployment paths document | Product owner | Day 45 |
| D-15 | Vendor operating model and support hours | Business hours; 24 by 5; 24 by 7 for severity 1 only | Business hours with 24 by 7 severity 1 coverage by an on-call rota once the first production tenant is live; support tiers per section 13.10 | Product owner | Before first production tenant |
| D-16 | First customer commercial terms | Paid pilot credited to year one (as in the selling motion); free pilot; design partner with discount | Paid pilot credited to year one; reference rights agreed in writing; no foundation-specific vocabulary in the product | Product owner | Before pilot start |
| D-17 | Repository and language stack | TypeScript (Node) monolith, Java or Kotlin, Python, Go | TypeScript end to end (one language for web, API, workers and the generated contracts), monorepo; revisit only for the agent sandbox runner and heavy ingest workers | Tech lead | Day 5 |
| D-18 | Build agent autonomy limits | Agents propose only; agents author and humans merge; agents author and merge low-risk changes | Agents author; a different agent reviews; a human from the owning group approves anything P1, security-sensitive, schema or permission related; no agent merges to production | Product owner with security lead | Day 5 |
| D-19 | Acceptance group per epic | Product owner alone; group per epic with owner and backup | Group per epic, each with a named owner and backup (approvals route to groups) | Product owner | Day 10 |
| D-20 | Sample tenant and test data policy | Synthetic only; sample standards foundation data; anonymized production | Synthetic data plus the sample foundation tenant seed; no production or customer data in agent environments | Security lead | Day 10 |
| D-21 | Product owner and tech lead of record | Named individuals, with backups | Name both before day 1; each has a named backup; neither is an AI agent | Executive sponsor | Day 1 |
| D-22 | Data residency and regions | US only first; US plus EU; customer choice | US region first; add one EU region at Fabric Enterprise or on demand; residency outside vendor regions needs the customer-account add-on | Product owner | Before first non-US prospect |
| D-23 | Compliance target and timing | SOC 2 Type I then Type II; ISO 27001; both; FedRAMP-class | SOC 2 Type I within about 6 months of first production tenant, Type II after 6 to 12 months of operation; ISO 27001 mapped in parallel; no FedRAMP-class scope in the first year | Security lead | Day 60 |
| D-24 | Customer-managed keys by edition | Vendor-managed per-tenant keys only; customer-managed keys on request; included in top edition | Per-tenant vendor-managed keys for all pooled; customer-managed keys in Fabric Enterprise and customer-account paths | Security lead | Day 60 |

## 16.2 Naming and wording rules that apply to every decision

1. The product owner's personal name never appears in the product, data, code, fixtures or commits. The sample executive persona is Casey Rowan and commits use a neutral author.
2. The first customer is a sample standards foundation; the sample tenant is Atlantic Systems with the Standards Portal and the Standards Platform as sample systems. The product never uses the customer's professional-standards vocabulary, abbreviations or standard-setter names; a lint in CI enforces the banned list.
3. No chatty AI voice in the product: data-driven insight only; AI-authored prose appears on request and is labeled.
4. AI agents get human first names plus role titles, are visually distinct from humans, and always have a named human sponsor and backup.

## 16.3 Risks

Product, commercial and operating risks. Build-execution risks are in section 15.7 (B-01 to B-14).

| ID | Risk | Likelihood | Impact | Mitigation | Owner role |
|---|---|---|---|---|---|
| R-01 | Name conflict: the leading name is unusable (Trellis rejected) and a late rename disrupts materials and domains | High | Medium | Single configuration value for the name; clearance before external use; no name in identifiers (D-08, D-09) | Product owner |
| R-02 | Trademark or naming clash found after launch | Medium | High | Professional clearance search; filing before announcement | Product owner |
| R-03 | Sensitive HR data (compensation, PTO, health-like) mishandled | Medium | Critical | D-10 default of references only; restricted class; encryption; no embeddings or model calls; reveal logging; privacy review before any new field | Security lead |
| R-04 | Pooled tenancy leak or noisy neighbor harms a customer | Low | Critical | Schema, row-level security and key per tenant; quotas; isolation tests in every release; dedicated path for sensitive customers | Security lead |
| R-05 | Model provider outage, price change or policy change | Medium | High | Gateway with adapters and fallback chain; budgets; contract terms; ability to run with agents paused | Tech lead |
| R-06 | AI agent causes harm (wrong write, data exposure, prompt injection through connector output) | Medium | High | Tool allow lists; approval gates; sandbox; output treated as untrusted; kill switches; evaluation harness; human sponsor | Security lead |
| R-07 | Pricing too low to cover model usage and support at midsize scale | Medium | High | Cost model in section 14.24; metered AI usage; cap per edition; validate with priced bill of materials | Product owner |
| R-08 | Connector sprawl and credential risk | Medium | High | Certified connector path, evaluation checklist, vault, per-connector identity, expiry on project-scoped connectors | Tech lead |
| R-09 | Customer expectation: prototype breadth versus production depth (123 modules, 84 still proposed) | High | High | Publish a module status list (live versus proposed); sell the spine plus two or three modules; value-ordered roadmap | Product owner |
| R-10 | Single first customer shapes the product too narrowly | Medium | Medium | Process content separated from product; overlays instead of forks; second pilot customer in a different sector | Product owner |
| R-11 | Data migration quality from the customer's sources is worse than the workbook assumes | High | Medium | Dry run with error report; owner and backup validation; quarantine and replay; staged waves | Delivery lead |
| R-12 | Operational burden of four deployment paths | Medium | High | One set of modules, images and migrations; private install as exception with separate support policy; refuse paths that do not share the test matrix | Tech lead |
| R-13 | Compliance evidence collected late | Medium | High | Control mapping from phase 1; evidence from logs and scans; readiness assessment before first production tenant | Security lead |
| R-14 | Backup or restore fails when needed | Low | Critical | Tier-based exercise schedule; quarterly restore test of a database snapshot into isolation; audit export in object-lock bucket; metrics on last proven restore | Tech lead |

Register filter: layer = governance; type in (DECISION, RISK); status = open.

Decisions needed: all rows in 16.1; the product owner confirms owner roles and dates at the day-1 review and records the named owner and backup for each decision in the register.
