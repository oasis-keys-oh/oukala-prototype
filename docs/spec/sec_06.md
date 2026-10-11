# 6. Data model

One catalog of 237 entities in 16 domains holds every field with an authority and a classification, and every record has a named owner.

Counts below come from the data atlas (`PLAT`, `ATLAS`) and the field catalog (`DATAMODEL`) of the build `out_v16b`. Production storage and architecture are in section 14.

## 6.1 Domains and entity counts

| Domain code | Domain | Entities |
|---|---|---|
| plat | Platform and integration | 54 |
| gov | Governance, risk and compliance | 41 |
| people | People and work | 22 |
| service | Service management | 21 |
| fin | Finance and contracts | 19 |
| ops | Operations and observability | 14 |
| portfolio | Portfolio and projects | 13 |
| money | Money (IT financial model) | 12 |
| met | met (raw label) | 9 |
| sec | sec (raw label) | 8 |
| cmdb | Services and configuration | 6 |
| know | Knowledge and AI | 5 |
| agile | Agile and releases | 5 |
| agree | Agreements and vendors | 4 |
| itom | itom (raw label) | 2 |
| ppl | ppl (raw label) | 2 |

Of the 237 entities, 143 are live and 94 are proposed. A proposed entity becomes live only when the data council approves it. Every entity has a named owner. Requirements: see OK-DATA-nnn.

## 6.2 Authority, classification and conflict rules

Every field declares who is the source of truth and how sensitive it is. The atlas holds 2,165 fields and all of them are classified.

| Authority | Fields | Meaning |
|---|---|---|
| platform | 2,036 | The product is the system of record |
| external | 96 | An outside system wins; the product reads it |
| shared | 33 | Both write; conflicts open a reconciliation item |

| Classification | Fields | Handling |
|---|---|---|
| public | 0 | No restriction |
| internal | 1,804 | Employees with a role that reads the entity |
| confidential | 150 | Role and need; masked in exports |
| restricted | 25 | Deny by default; reveal logged; masked otherwise |
| personal | 186 | Subject, manager chain and People Operations only |

Data flows between modules also carry a freshness class (live 658, near-live 102, hourly 55, daily 22 fields) and one of three conflict rules: "Oukala wins" (653), "External system wins" (139), "Newest wins, differences open a reconciliation item" (45). About 730 flows are registered; 562 run on events, 126 in batch and 55 through a person.

## 6.3 Reference targets

Every field of type reference names its target entity. The field catalog holds 710 reference fields and none lacks a target. The check is `ci_refs.js`. A reference to a person resolves through the directory, never by free text. The master data model screen draws the relations for the chosen mode and only between visible boxes.

## 6.4 Configuration item model

The CMDB holds 162 CIs in 22 classes; 156 have an owner group and 157 have an approver group.

Each CI carries three ownership fields from the standing decision.

| Field | Rule | Coverage now |
|---|---|---|
| Owner | An individual for end-user devices; a group for shared infrastructure (`owner_kind`) | 156 group, 1 person, 5 unset |
| Primary support group | The group that works incidents | Set per CI; class default fills gaps |
| Approver group | The group that approves changes, with decision criteria | 157 of 162 |

Class defaults (`ci_ownership_default`) fill gaps in bulk. An assignment record (`ci_assignment`, restricted) tracks who holds an end-user device and when it was returned. CMDB health scores 89.4.

## 6.5 Cost centers

Cost centers map to org units, budget owners and GL segments through an editable table (`cost_center_map`, extending `cost_center`). The ERP list is the translation table.

| Measure | Value |
|---|---|
| Cost centers in the map | 9 |
| Org units mapped to a cost center | 13 of 13 |
| Budget mapped to a cost center | $2.91M of $2.91M |
| One cost center to one org unit | 4 of 9 (44 percent) |
| Spend in shared cost centers | $1.3M (45 percent) |
| Gap types listed | No org unit (2), no budget owner (1), no GL segment (2), many to one (2), no budget lines (3) |

## 6.6 Organization, people, positions and status

The org model reuses the person, organization unit and position entities; it does not add a second people table.

| Item | Value |
|---|---|
| Org units | 13 |
| Heads (humans) | 45: 38 full time, 4 part time, 3 contractor, 0 intern |
| FTE | 43.8 current; 53 planned |
| Vacancies | 8: open 3, sourcing 2, interviewing 2, offer out 1 |
| Agents | 15, each with a named human sponsor |
| Directory | 89 entries: 62 employees, 9 contractors, 3 managed services, 15 agents |

Position carries 14 fields. Employment types are full time, part time, contractor and intern, held as `employment_type` and `fte` on person and position. A vacancy is a position with status, requisition id, target start and budget line, not a separate entity. Changes emit `person.created`, `person.updated`, `person.moved`, `person.terminated`, `person.employment_type_changed`, `vacancy.opened`, `vacancy.filled` and `vacancy.closed`.

The status catalog has 14 configurable statuses in three categories. Each status sets an approval group, a handover rule (never, by rule, always), a device rule (retain, review, return) and what it launches (process, catalog item or order guide).

| Category | Statuses |
|---|---|
| Active | Active |
| Absence | PTO, medical or family leave, parental leave, sabbatical, leave of absence, suspended |
| Separation | Transferred, retired, resigned, terminated, laid off, contract ended, deceased |

## 6.7 Compensation, benefits and time off

Pay, benefit and time-off data sit in restricted entities, shown only in a masked tab of the org chart.

| Entity | Class |
|---|---|
| `compensation_record` | restricted |
| `benefit_enrollment` | restricted |
| `pto_balance` | restricted |
| `pto_request` | restricted |
| `status_change` | restricted |
| `time_entry` | restricted |


Rules: deny by default; People Operations may reveal, and every reveal is logged to the audit chain; a people manager sees time off for the reporting chain only. Masked values show as "$•••,•••" or "••••••".

## 6.8 Lists registry and single-source rules

`LISTS` is the one accessor per entity list. It defines 14 lists: projects, people, teams, vendors, cost centers, CIs, services, tables, entities, fields, metrics, processes, changes, incidents and demand. Each reads the system of record and caches on a cheap version key.

1. A list is defined once; no module keeps a copy.
2. Every picker and form reads `LISTS` and registers as a consumer.
3. Shared numbers live in `FACTS` with a conflict check, not in each screen.
4. A derived registry may keep its own array only if a test shows it is a subset.

## 6.9 Persistence and the event log

`STORE` persists edits in the browser (IndexedDB) for the prototype. It holds 14 entity sets, including workflow instances, agent registry and runs, event rules, tenants, overlays and import batches. Slices of the application state are tracked by path.

Every change enters an append-only log whose hash chain verifies (531 entries at last check). `EVENTS` keeps 97 event definitions and a firing log of 122 entries. Entities can be promoted from proposed to live through a promote flow. The production database is specified in section 14.

## Known gaps

1. The field catalog holds 274 tables and 3,031 fields; 1,076 fields in it carry no authority or classification. The atlas covers 237 entities.
2. 5 near-duplicate entities are flagged and 4 planned entities are not yet defined.
3. Four domain codes (itom, sec, met, ppl) carry raw placeholder labels and the steward "Data council chair".
4. 94 entities are proposed and await data council approval.
5. 5 of 9 cost centers do not map one to one; 10 gaps are open.
6. Persisted state ignores changed seed data after first load.
7. Only 25 of 275 permission-scoped entities have row or field rules (see section 9).

Register filter: Module=DATA (6.1 to 6.3, 6.8, 6.9), Module=ORG (6.6, 6.7), Module=TECH (6.4), Module=MONY (6.5).
