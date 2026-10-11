# 12. Business continuity and disaster recovery

Resilience is run as a programme with one framework, four service tiers, fixed change windows, 15 plans and a trace from each application to its people, sites and vendors.

Counts were read from `BCX` in the build `out_v16b`. The programme starts on 2026-03-01 and has 8 screens in the Resilience menu group.

## 12.1 Framework: BETH3 plus Data

The framework scores continuity across six dimensions. Each has a target of level 3, guidance questions and five maturity levels.

| Code | Dimension |
|---|---|
| B | Buildings and facilities |
| E | Equipment: power, HVAC, plumbing, safety |
| T | Technology |
| D | Data |
| H | Human resources |
| 3 | Third parties |

The working name is BETH3D. The name is not final. Options are below.

| Option | Reading |
|---|---|
| BETH3-D | Hyphen before Data |
| DEBTH3 | Data first |
| THEB-D3 | Reordered letters |

Maturity levels are 1 Initial, 2 Planned, 3 Exercised, 4 Measured, 5 Optimized. Requirements: see OK-RES-001 to OK-RES-nnn (register filter: Module=RES).

## 12.2 Tier policy

| Tier | Name | RTO | RPO | MTD | Exercise | Window | Notice | Approver | Retest |
|---|---|---|---|---|---|---|---|---|---|
| T1 | Alpha | 240 min | 15 min | 480 min | Live failover, 12 months | CW-B | 21 days | G-RC | 180 days |
| T2 | Bravo | 720 min | 240 min | 1,440 min | Alternate: live one year, tabletop next | CW-A, CW-B | 14 days | G-CAB | Not set |
| T3 | Charlie | 2,880 min | 1,440 min | 7,200 min | Tabletop | CW-C | 10 days | G-AOF | 365 days |
| T4 | Delta | 7,200 min | 10,080 min | 20,160 min | Documented review | CW-C | 5 days | G-AOF | Not set |

RTO is time to restore service. RPO is the data loss allowed. MTD is the maximum tolerable downtime.

## 12.3 Calendar and change windows

| Window | Time | Use |
|---|---|---|
| CW-A | Weeknight, 22:00 to 02:00, Monday to Thursday | Tier 2 exercises |
| CW-B | Saturday, 01:00 to 07:00 | Tier 1 and 2 exercises |
| CW-C | Business hours, 09:00 to 17:00 | No change window needed |

The calendar screen shows exercises, notice periods. An exercise needs notice by tier and approval by the tier group. Four groups act: G-RC (resilience council), G-CAB, G-AOF (application owners forum) and G-FAC (facilities).

## 12.4 Plans

The build holds 15 plans, for example BCP-101. A plan links to an application and has an owner and a review date. A plan past its review cycle shows as stale. An application without a plan shows as a gap.

## 12.5 Traceability

The trace graph holds 244 nodes. It joins applications to components, data assets, sites, equipment, roles, vendors, SOPs, communications and obligations.

| Object | Count |
|---|---|
| Applications | 18 |
| Components | 203 |
| Plans | 15 |
| Exercises | 18 |
| Declarations | 1 (DEC-001) |
| Sites | 5 |
| Equipment | 8 |
| Data assets | 12 |
| Roles | 9 |
| Vendors | 7 |
| SOPs | 8 |
| Communications | 6 |
| Obligations | 18 |

## 12.6 Gap kinds and metrics

Thirteen gap kinds are computed from the trace: no plan, overdue exercise, stale plan, review due, knowledge article missing, CI without owner, single point of failure, vendor exit missing, vendor attestation missing, restore untested, RPO not met, equipment unmaintained and successor missing. Examples in the sample: the Standards Platform and Standards Portal have live failover overdue.

Ten metrics track the programme.

| Metric | Measures |
|---|---|
| `m_bc_plan_cov` | Plan coverage |
| `m_bc_ex_comp` | Exercises completed |
| `m_bc_rto_att` | RTO attained |
| `m_bc_rpo_att` | RPO attained |
| `m_bc_spof` | Single points of failure |
| `m_bc_days` | Days since last exercise |
| `m_bc_ci_owner` | CIs with an owner |
| `m_bc_vend_exit` | Vendors with an exit plan |
| `m_bc_data_restore` | Data restores tested |
| `m_bc_maturity` | Programme maturity |

## 12.7 Declare a disaster

A declaration (DEC-001 in the sample) opens a record with the time, scope, declaring role and tier affected. It raises `bcdr.*` events. The declare screen is `bc_decl`.

## Known gaps

1. Live failover for the Standards Platform and Standards Portal is overdue.
2. Tier 2 and Tier 4 retest periods are not set.
3. The framework name is not final.
4. Declarations run on seed data; no pager or call tree is connected.
5. Only 18 applications are mapped to a tier.

Register filter: Module=RES (all subsections).
