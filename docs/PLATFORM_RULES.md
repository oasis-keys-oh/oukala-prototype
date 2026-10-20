> Copied from the Project doc `claude/PLATFORM_RULES.md` (CL-50). Work status and priority live only in the Product Backlog, not here.

# Falconaire Platform Rules

Version: 1.0, approved by Omar 2026-10-19. Decisions 1 to 5 recorded below (step modes, shared chat, blocking gate built into the foundation, real multi-tenant SaaS, cross-tenant parked). Remaining open items are listed at the end. Replaces nothing yet: it consolidates `MODULE_GUIDE.md`, `docs/FEATURE_CONTRACT.md`, `docs/DATALINK_CONVENTION.md`, the decisions logs and the Design Feedback Register, and adds the rules that were missing.

These rules apply to **every application on the platform**, not only IT: projects, services, change, risk and resilience, finance, people, facilities, clinical or site operations, and any industry scenario (healthcare, mining, storage and backup, or the next tenant). IT service management is one application among them, not the template.

How to read the tables: **Source** says where the rule comes from (`existing` = already written down, `new` = added in this draft, `owner` = stated by Omar 2026-10-19). **Enforced** says how it is checked today: `gate` = platform gate or contract check, `test` = a script, `lint` = proposed build check (cleanup backlog), `none` = convention only.

## Part 1. The five building blocks everything is made from

Every application is assembled from these shared objects. If a feature needs something that is not on this list, it goes through rule R1 (reuse, extend, new) before it is created.

| Object | What it is | Where it lives |
|---|---|---|
| Record | Any business object (ticket, project, risk, work order, patient referral, equipment asset), with an id, owner, backup, state and links | Data model (`DATAMODEL`, `ATLAS`) |
| Process | A numbered, editable set of steps with owners, inputs, outputs and gates | `PROC` and `PROCLIB`, edited only in the workflow designer |
| Participant | Who or what acts: a person, a **robot**, an **agent**, a contractor, or a managed provider. Every step has one execution mode: **human**, **robot** or **agent** | People directory `DIR`; agent registry; robot registry |
| Metric | A defined measure with formula, owner, target, baseline and remediation | `METRICS`, shown with `fchip` |
| Tenant | An isolated slice of the application owned by one customer organization: its data, people, vocabulary, configuration, branding and keys. Every record belongs to exactly one tenant | `TENANT` (demo today; real tenancy per Part 2, section D) |
| Chat | One shared conversation service: person to person, team, function, record and agent threads | Platform chat (`mod_chat`), reused everywhere; never a private messaging copy |

## Part 2. Rules

### A. Reuse before you build (screens, data, processes, components)

| ID | Rule | Source | Enforced |
|---|---|---|---|
| R1 | **Reuse first, then extend, then create new, for everything**: entities and fields, screens, features, components, patterns, process definitions, metrics, lists, icons and text. Before creating any of them, search the registry and write down what was found and why it was not enough. | existing (entities) + owner (extended to screens and features) | gate for entities; `none` for screens; `lint` proposed |
| R2 | **Screens follow an archetype.** Every screen is an instance of a named archetype from the screen pattern library (for example: dashboard-first list, record detail drawer, 360 view, board, designer canvas, intake form, approval inbox, report). A new screen declares its archetype in `REG`. If no archetype fits, propose a new archetype for review instead of building a one-off. | new | `lint` proposed |
| R3 | **Do not add a screen when a tab, filter, drawer or existing screen can show it.** New screens must say which existing screen they were compared with. Duplicates are folded into families with a view switcher; no screen id is deleted, so links never break. | existing (fold) + new (compare) | `none` |
| R4 | **Every process is shown and edited through the workflow designer.** Any place that displays a process, step or child step (cards, drawers, journey boxes, org chart, build list, module maps, onboarding) renders from `PROCLIB` and opens the designer on click. No private diagrams, no hand-drawn step strips, no copies of a process inside a module. | owner | `lint` proposed |
| R5 | **Every process, step and child step has a stable number** (scheme `P-014`, `P-014.3`, `P-014.3.1`; assigned once, stored, never reused) and is searchable and linkable by that number. | new (handoff task 1) | `none` until built |
| R6 | **One source of truth for every value.** Numbers and units come from `FACTS`; agent and robot counts from `AGENTS_STATE`; roles from the role registry; lists from `LISTS`; services and CIs from one graph; people from `DIR`. A module never keeps its own copy. | existing | test (FACTS conflict test) |
| R7 | **Use the shared components**: `btHTML` for lists that can reach hundreds, `mpHTML` for filters over about 6 values, `lrHTML` for linked records, `openForm` for forms, `views` for tabs, `kpi`/`fchip` for metrics, `data-link="type:id"` for navigation. Do not hand-build a table, picker or tab strip. | existing | test (data-link walker); `none` for others |

### B. No hardcoded anything

| ID | Rule | Source | Enforced |
|---|---|---|---|
| R8 | **No literal values in view code.** Colors, font sizes, radii, spacing, z-index and breakpoints come from tokens. Product name comes from one `BRAND.name` constant. "Today" comes from one `TODAY` constant. Dollar rates, thresholds, SLAs, labels and sample data come from registries or tenant data packs, never typed into a render function. | existing (colors) + new (rest) | `lint` proposed |
| R9 | **Sample data lives in tenant data packs, not in screens.** A screen reads records; it never contains a customer's name, a person, a figure or a date as a string literal. | new | `lint` proposed |
| R10 | **Shared helpers exist once** (`money`, `pct`, `esc`, `slug`, `clamp`, `uid`, date helpers). A module that needs a variant extends the shared helper; it does not redeclare it. | new | `lint` proposed |
| R11 | **Every list, graph, picker and dropdown holds at Enterprise scale** (`SCALE.set(true)`), not only at demo volume. | existing | test |

### C. People, ownership and conversation

| ID | Rule | Source | Enforced |
|---|---|---|---|
| R12 | **Every record, process, metric, entity, agent, robot, policy, budget line, vendor, contract, risk and knowledge item has one accountable human owner and a different named backup.** A team, a role or an AI agent does not count; an agent or robot needs a human sponsor. Gaps show a "No backup" badge and are never hidden. | existing (Contract rule 5) | gate (`ownx`) |
| R13 | **Every owner name is a live link.** Wherever an owner, backup, approver, assignee, sponsor, requester or reviewer appears (cards, tables, drawers, journey boxes, org chart, emails, chat), it renders through one `ownerChip(name)` that opens Person 360 and offers **Message** (a direct chat with that person) and **Open chat on this record**. Groups, teams and functions open their page with **Message group**. Agents and robots open their card, which shows the human sponsor. Plain-text names are a defect. All of it uses the one platform chat (R13a); nothing builds its own. | owner | `lint` proposed; walker extension proposed |
| R13a | **One chat service, always reused.** People, teams, functions, records, processes and agents are all chat addresses in the same service, so a conversation can cross people, teams and functions inside the app and keeps its record context. Threads follow the record and tenant permissions: a person sees a thread only if they can see the record. No module adds its own comment box, inbox or messaging. | owner (decision 2) | `none`; chat intents gate |
| R14 | **Approvals route to a group, never a person.** The requester can never approve their own request. Access grants are time-boxed rules in the one permission model (180 days, 90 for confidential or restricted), recertified on expiry. | existing | partly (group bindings not enforced on catalog, budget, change) |
| R15 | **Assign to teams first**; individual assignment only by claiming or with a stated reason. The kind of assignee (human, agent, robot, contractor, managed provider) is always visible. | existing | `none` |

### D. Tenants (real SaaS multi-tenancy, with demo switching until then)

Goal (Omar, 2026-10-19): a cloud-hosted SaaS application where most organizations sign in to their own slice of the data on the same application. Later customers will include managed service providers and organizations that act across several tenants (mergers and acquisitions, holding companies). This is real functionality with real security. The prototype is database-free, so it can show the behavior but cannot prove security; rules below say what the prototype must do now and what the real build must guarantee.

| ID | Rule | Source | Enforced |
|---|---|---|---|
| R16 | **Everything is tenant-aware by construction.** Every record, file, search document, cache entry, log line, notification, chat thread, metric value, agent memory and export carries a tenant id. Screens never read data directly: they read through a tenant-scoped data access layer. A screen that does not use it is a defect against the contract. | owner | `none`; today only Journey maps, Org chart with agent assist and Build list follow the tenant |
| R17 | **Switching is seamless** in demo and in production for people with more than one tenant: no reload, same screen and view kept, user state (filters, tab) kept, tenant state replaced. The active tenant is always visible on screen. | owner | test proposed |
| R18 | **No cross-tenant leakage**, anywhere: screens, search, chat, notifications, exports, AI answers, error messages, URLs and cache. A leakage test switches through all tenants and searches every surface for any other tenant's names and ids. | new | test proposed |
| R19 | **Each tenant keeps its own vocabulary and configuration** (terms, roles, processes, metrics, branding, approvals), so one screen serves many industries instead of being forked. Meridian is the default sample; other samples are fictional. | owner + new | `none` |
| R20 | **Tenant content comes from tenant packs and configuration only.** Adding a tenant adds a pack (organization, people, personas, journeys, processes, records, metrics, vocabulary, images) through the same path a real customer's data takes. No screen code changes. | new | `none` |

#### D2. Tenant security (requirements for the real build; plans, not claims)

No certification or compliance claim may be made from this section. Each item is a requirement to design, build and have reviewed by a qualified security architect before any real customer data is stored.

| ID | Rule | Source | Enforced |
|---|---|---|---|
| R43 | **Isolation is enforced below the application.** The data layer rejects any read or write whose tenant id does not match the caller's active tenant (for example row-level policies in the database, plus tenant-scoped keys in caches, queues, search and file storage). Application code is a second line of defense, not the first. | new | `none`; design needed |
| R44 | **Identity is separate from tenant.** A person is one identity with one or more *memberships*, each in one tenant with its own roles. Roles, permissions and approvals are evaluated per membership. Default access is denied unless a rule allows it. | new | `none` |
| R45 | **One active tenant per request.** Every request carries an explicit active tenant. Writes always target exactly one tenant. Switching tenants is an explicit, audited action; it never merges two tenants' data in one write. | new | `none` |
| R46 | **[Parked, future scenario] Cross-tenant access is granted, scoped and time-boxed.** Managed service providers, M&A teams, auditors and parent organizations get access only through a grant created or approved by the *data-owning* tenant. A grant names the grantee, the tenant, the entities or views, the actions, a purpose and an expiry (default 90 days), is visible to both sides, can be revoked at any time, and is recertified on expiry. Standing "super-user" access across tenants is not allowed. | new | `none` |
| R47 | **[Parked, future scenario] Cross-tenant views are read-only and aggregated unless a grant says otherwise.** A person with several memberships sees each tenant separately; a portfolio view (for example a service provider's all-customers dashboard) shows only data each tenant has granted, labeled with its source tenant. Moving data between tenants is a controlled export/import with approval on both sides, never a shared record. | new | `none` |
| R48 | **[Parked, future scenario] Tenant relationship types are first-class**: standalone, parent/child (holding company, subsidiaries), service provider and customer, deal room (M&A: a ring-fenced shared space with named participants from two or more tenants, closed on a date, with data returned or deleted by policy). Each relationship type has its own default permissions. | owner | `none` |
| R49 | **AI and robots respect the tenant boundary.** An agent or robot runs in exactly one tenant's context. Prompts, retrieved documents, embeddings, memory, logs and training signals never mix tenants. A model call outside the AI gateway is not allowed. A shared model may serve many tenants, but no tenant's content is used to improve answers for another. | new | `none` |
| R50 | **Per-tenant keys and data controls**: encryption keys, retention, data location and deletion are tenant-level settings; tenant offboarding deletes or returns all of its data and proves it. | new | `none` |
| R51 | **Everything cross-boundary is audited** and visible to the tenant's administrator: sign-ins, switches, grants, cross-tenant reads, exports, and support-staff access. Product staff access to customer data needs a tenant-approved, time-boxed grant like any other. | new | `none` |
| R52 | **Security claims are plans.** The prototype labels tenant isolation as simulated. No SOC 2 or similar claim, no "bank-grade" language, until it is true and independently verified. | existing + new | `none` |

### E. Automation vocabulary (coined for this product)

| ID | Rule | Source | Enforced |
|---|---|---|---|
| R21 | **Every process step has one execution mode: human, robot or agent.** "Automatic" is retired from the lexicon. *Human*: a person does the step. *Robot*: a deterministic, predefined function (if / then / else) that runs when its trigger fires; the same input always gives the same output, no model, exactly testable. *Agent*: an AI agent with LLM-backed reasoning, guided by prompts and guidelines, deciding one very narrow task. The step kind formerly shown as "Function" (indigo) is the robot. Approval gates remain a separate step type. Use the same three words in the designer, process drawer, org chart, build list, chat, search, help text, exports and documentation. | owner (decision 1, revised) | `lint` proposed |
| R21a | **Robots and agents both start from a trigger.** A trigger is a metric crossing a threshold, a schedule or timer, a process step being reached, an event, or a record change. A human step starts by assignment. Triggers are chosen from one shared trigger catalog, never typed per step. | owner | `none` |
| R22 | **Choose the cheapest mode that is correct.** If the answer is always the same for the same input, build a robot, not an agent (cheaper, instant, exactly testable). Use an agent only for a narrow task where human-level judgment is needed. Every agent works inside a box: tier, budget, confidence floor and kill switch, with a named human sponsor, and its prompts and guidelines are versioned and visible. | owner + existing | `none` |
| R23 | **Participant kinds are always distinguishable**: person, robot, agent, contractor, managed provider, each with its own avatar treatment (a dashed ring means proposed, not running). Nothing proposed is ever shown as live. | existing | `none` |
| R24 | **"Function" keeps its ordinary meanings** (a business function, a mathematical function, "function lost" in impact analysis). Only the step kind is renamed. | new | `none` |

### F. Metrics, standards and maturity

| ID | Rule | Source | Enforced |
|---|---|---|---|
| R25 | **Every number is a defined metric** with owner, formula, target, baseline and remediation, shown with `fchip`, plus one outcome metric and one health metric per feature. | existing | gate |
| R26 | **Every process has a maturity record** on the shared scale (`MAT`, default `cmmi`), six dimensions, with a target level. No parallel scales. | existing | gate |
| R27 | **Name the reference standard for the domain** with `stdChip` and say how the design follows it. Pick the standard that fits the application (IT service: ITIL; portfolio: PMBOK or SAFe; risk and resilience: a risk or continuity standard; security: NIST; quality or safety: the relevant industry standard). Research the current edition; do not assume. | existing (IT) + new (any domain) | gate (presence only) |
| R28 | **Every color, bar, stripe or dot that carries meaning has a legend or tooltip.** | existing | `none` |

### G. Honesty, naming and sensitive content

| ID | Rule | Source | Enforced |
|---|---|---|---|
| R29 | **Label every number** as prototype fact, modeled or hypothesis. Dollar figures are modeled from an editable rate and shown as illustrative. Never present a simulated connector, AI run or sync as live. | existing | `none` |
| R30 | **No price points** until a priced bill of materials exists. **No certification claims** (SOC 2 and similar) except as stated plans. | existing | `none` |
| R31 | **Naming**: the product name is **Falconaire** (decided 2026-10-19; no trademark clearance is implied), set only through `BRAND.name`. "Oukala" and "Shaheen" are historical names and stay out of new product assets. Never use Core, Fabric, Fabric Enterprise or Trellis externally; never use FAF, Codification, ASU, ASC, FASB or GASB in the product. | existing | `lint` proposed |
| R32 | **No real names or data** in product assets: not the owner, his employer, clients, or any real organization. Sample people and organizations are fictional. No fake testimonials or invented customer quotes. | existing | `lint` proposed |
| R33 | **Intellectual-property clean**: image provenance recorded; IT frameworks (ITIL, IT4IT and similar) are paraphrased, never copied. | existing + open question | `none` |

### H. Interface quality

| ID | Rule | Source | Enforced |
|---|---|---|---|
| R34 | Every screen: hero, lens note, `procCard`, dashboard first (stats, charts, what needs attention), then lists, then detail and forms. | existing | gate (partial) |
| R35 | AI output shows lineage and guardrails ("why"). Chat can control everything and every feature has a chat intent. Every action is audited. | existing | gate (`ASKX`, audit) |
| R36 | Text is never squeezed (`overflow-wrap:break-word`, `minmax(0,1fr)`); repeated cards align; no horizontal scroll at 400 px; light, dark and phone are checked on every build. | existing | test (spacescan, cardscan) |
| R37 | Plain American English, acronyms defined on first use, no em dashes, no visible raw text boxes, accessible controls (buttons are buttons, focus visible, contrast, keyboard fallback for drag and drop). | existing | `none` |
| R38 | Information scales by level: executive headline with drill-down, managers working views, specialists their craft, contributors their own work. A higher level can always open what is below. | existing | `none` |

### I. How modules are built

| ID | Rule | Source | Enforced |
|---|---|---|---|
| R39 | One IIFE per module; namespace every class and attribute with the module prefix; do not edit another owner's file; register screens with `REG`; persist state on `S.<prefix>`. | existing | `none`; `mod_viz2` breaks it |
| R40 | **No new wrapper of `render`, `go` or `openDrawer`.** Use the hook registry once it exists. | new | `lint` proposed |
| R41 | **Waivers**: a feature that cannot meet a rule needs a waiver with reason, covering control, owner and an expiry of at most 90 days, raised as a debt item. | existing | gate |
| R42 | **Definition of done** is the Feature Contract score (rules R1 to R7 for reuse, process, data; R25, R26 metrics; R12 ownership) plus the new checks R13 (owner links), R16 (tenant-aware) and R21 (robot vocabulary) once they can be measured. | extended | gate + proposed |

## Part 3. Feature Contract changes (decided)

Decision 3 (Omar, 2026-10-19): the new checks **block promotion at the gate** and are **part of the foundation**, meaning the platform primitives are built so that doing the right thing is the default (a screen archetype to start from, one `ownerChip`, a tenant-scoped data access layer, a process view that is the designer, a step-mode picker with human/robot/agent). A rule that the foundation does not make easy will be broken.

| New contract rule | Content | Check id | Gate behavior |
|---|---|---|---|
| 6. Reuse of screens and components | R1 to R4, R7: archetype declared, comparison recorded, designer used for any process | `ct_reuse` | Blocks team tier and up |
| 7. Tenant-aware and secure by construction | R16 to R20, R43 to R49: reads only through the tenant data layer, passes the leakage test, uses tenant vocabulary, respects grants | `ct_tenant` | Blocks team tier and up |
| 8. People, chat and step conventions | R13, R13a, R21: owners render through `ownerChip`, chat uses the shared service, step modes are human/robot/agent | `ct_people` | Blocks team tier and up |

Transition: existing screens are scored by the retrofit matrix with a target date for compliance. New and changed screens block immediately once the foundation pieces exist. The headline score stays 0 to 4 for rules 1 to 4; the new checks are reported beside it and are also required for promotion.

## Part 4. Gaps found while writing this (and where they are tracked)

| Gap | Evidence | Tracked as |
|---|---|---|
| Designer-for-processes was not written as a rule | `procCard` and insert-between exist; no rule forces reuse; no check | R4; cleanup CL-52 |
| "No hardcoded" was spread over a few rules | 408 hex colors, 1,831 literal font sizes, 1,731 literal radii, "Oct 6" in 47 modules, local `money`/`pct` in 12 and 19 files | R8 to R10; CL-20 to CL-22, CL-31 to CL-34, CL-46 |
| Screen reuse not governed | 186 registered screens, no archetype list | R2, R3; CL-51 |
| Owner names are not consistently links | 51 `owner}` text interpolations found; 219 `pchip` uses; gate `ownx` checks presence, not rendering | R13; CL-53 |
| Tenants are partly implemented | `SCN` and `TENANT` switch Journey maps, Org chart, Build list only; other screens still show Meridian | R16 to R20; CL-54, CL-55 |
| Term for deterministic steps is split | designer, studio, persona and impact modules use "Function" (`who:"fn"`, about 25 hits in 4 files plus 22 files using `.fn`); journey modules already say "robot" (179 hits in 10 files) | R21 to R24; CL-58 |
| "Automatic" is still a step kind in the code | `who:"auto"`-style matches about 800 in 112 files (overcounts: includes unrelated uses of the word auto); the word "Automatic" shown as a label or owner in 195 places in 40 files; "auto-approval" in 80 places in 21 files | R21; CL-58, CL-72 |
| Rule 5 badge is not shown | `OWNX.badge` appears in 0 call sites in module code (heuristic; verify in the browser) | R12; CL-53 |
| Tenancy is a demo switch only; no real isolation, identity or cross-tenant model | `SCN`/`TENANT` swap sample data; no persistence or authentication (Design Feedback F59 open) | R16 to R20, R43 to R52; CL-62 to CL-67 |
| No shared chat address book for teams and functions | person/team/function chat addressing not confirmed in the prototype | R13a; CL-54 |
| Rules are enforced mostly by convention | Of 53 rules (R1 to R52 plus R13a), about 12 have a gate or test today | Part 3; CL-46, CL-57 |

## Decisions recorded (Omar, 2026-10-19)

1. Steps are human, robot or agent. "Automatic" is retired. A robot is a deterministic predefined function that acts when a trigger fires (metric threshold, timer, process step, event). An agent is an LLM-backed reasoner for a very narrow task. (R21, R21a, R22)
2. Chat is one reused service across people, teams and functions. (R13, R13a)
3. New contract checks block promotion at the gate and are built into the foundation. (Part 3)
4. Tenancy is real SaaS multi-tenancy with real security. Isolation default: shared database with row-level security per tenant, with a path to dedicated databases for customers who need them. (R16 to R20, R43 to R45, R49 to R52)
5. Cross-tenant access (service providers, M&A deal rooms, parent/child organizations) is **parked as a future scenario**. R46 to R48 stay in the document as design intent only; nothing is built or demoed for them now, but the identity model (R44, R45) must not make them impossible later.

Decision 6 (2026-10-19): this rules document is approved as the single entry point for platform rules.
Decision 7 (2026-10-19): no compliance date is set for existing screens now. The retrofit matrix reports scores first; revisit when it shows how many screens fail.
Decision 8 (2026-10-19): the outside security review of the tenant design happens "when it's time" (before any real customer data is stored), not now.
Decision 9 (2026-10-19): the persistence and authentication timeline is not decided yet ("not yet").

## Still open

1. **Persistence and authentication timeline**: deferred by Omar. Until it is set, tenant rules are demonstrated, not proven. The data-store and workflow-runtime choice (Postgres-backed state machine vs Temporal) stays open.
2. **"Pre-approved" gate path wording**: recommendation is to rename it as a robot path; awaiting a yes or no.
3. **Triggers to revisit**: set a compliance date once the retrofit matrix shows the failing-screen count; choose the security reviewer when persistence and sign-in work starts.
