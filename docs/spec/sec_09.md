# 9. Security and permissions

Access is denied unless a rule allows it, rules are data, and every decision and reveal lands in a tamper-evident log.

Counts were read from `PERM`, `PERSONAS` and the admin state of the build `out_v16b`. Production identity and key management are in section 14.

## 9.1 The permission model

The model has three nested scopes. A rule can sit at any scope, and a narrower scope refines a wider one.

| Scope | What it controls | Levels |
|---|---|---|
| Object | Which things a role can reach | Table, entity, screen, section, action |
| Row | Which records inside an object | Conditions on owner, unit, cost center, status |
| Attribute | Which fields inside a record | Read, write, masked, hidden |

Rules are data, persisted through `STORE`, and editable on the access screens. A change emits `permission.changed`; a refusal emits `access.denied`; a reveal emits `data.revealed`. Requirements: see OK-SEC-001 to OK-SEC-nnn (register filter: Module=SEC).

## 9.2 Deny by default

Sensitive classes (restricted and personal, section 6.2) are denied unless a rule allows them. For other classes a screen tier sets the baseline.

| Rule count | Value |
|---|---|
| Roles | 17 |
| Groups | 10 (GRP-BUD, GRP-FINREV, GRP-ARCH, GRP-PORT, GRP-AP, GRP-CAB, GRP-SEC, GRP-HR, GRP-MGR, GRP-GEN) |
| Object rules | 222: allow 217, deny 5 |
| By tier | Screen 152, section 28, untiered 42 |
| Field rules | 43: read 37, write 2, masked 2, hidden 2 |
| Actions registered | 14, such as approval.decide, budget.edit, comp.reveal, timesheet.approve, req.create, req.approve, receipt.record |

## 9.3 Persona matrix summary

Screens a persona can read, out of 169, using `PERM.can`.

| Persona | Screens | Persona | Screens |
|---|---|---|---|
| Executive | 169 | Auditor (read only) | 155 |
| Architect | 125 | Platform admin | 139 |
| Portfolio lead | 99 | Project manager | 96 |
| Change manager | 92 | Finance approver | 85 |
| Service desk lead | 84 | Employee | 52 |
| New hire | 52 | Board member | 50 |
| Vendor guest | 6 | | |

The menu counts in section 3.4 differ because the menu hides some readable screens. Permissions decide access; the menu only decides visibility.

## 9.4 Separation of duties

Four rules block a conflicting pair of duties for one person.

| Rule | Conflict |
|---|---|
| SOD-1 | Edit and approve the same record |
| SOD-2 | Security administration and approval |
| SOD-3 | Configuration and approval |
| SOD-4 | Finance and configuration |

Permission sets package duties: PS-AP, PS-BUD, PS-HR, PS-CFG, PS-ONC and PS-AUD. A set that creates a conflict needs an exception with an expiry. Overlays are checked against the same rules (section 7.3).

## 9.5 Approver group membership

Approval rights come from groups (section 7.4). Membership changes go through the access screens. A leaver is removed from every group by the leaver package.

## 9.6 Joiner, mover and leaver packages

| Package | Use |
|---|---|
| PK-J1, PK-J2 | Joiner access by job family |
| PK-M1 | Mover: remove the old access, add the new |
| PK-L1 | Leaver: remove all access and return assets |

Packages launch from a status change (section 6.6) and write one audit entry per grant or removal.

## 9.7 Masking

Masked fields show a fixed shape: "$•••,•••" for money and "••••••" for other values. A reveal needs the action permission, such as `comp.reveal`, and writes a `data.revealed` event with the person, field and reason. Exports apply the same mask.

## 9.8 Audit chain

Every write and every reveal appends an entry that holds the hash of the entry before. Verification recomputes the chain. The check read ok at 531 entries. The log is append-only and has no edit or delete action in the interface.

## 9.9 Access reviews

Access reviews run as campaigns. The Q4 campaign holds 8 items. A reviewer certifies or removes each grant. Reviews cover groups, permission sets and exceptions.

## Known gaps

1. Only 25 of 275 entities have a permission rule; the rest rely on screen tiers.
2. 42 of 222 object rules have no tier.
3. Permissions run in the browser for the prototype; no server enforces them.
4. The audit chain is local to one browser store; no external anchor exists.
5. Five deny rules exist against 217 allow rules, so deny by default rests on the missing allow.
6. The access review campaign has 8 items and no recurring schedule.

Register filter: Module=SEC (all subsections); 9.5 and 9.9 also Module=APPR.
