# Maturity tour map: what already exists behind each beat

Read-only inventory for backlog item DC-33, run before DC-32. It names the screen and module that already does each beat of the Showroom tour "Process maturity and roadmap" (`SHOW.demos`, id `maturity`, in `src/mod_r33_showroom.js`), and checks whether each process has a maturity record as rule R26 requires. Nothing was built or changed. It carries no status or priority. Beats with no existing feature are reported as gaps for DC-34, not built (DC-32 rule).

Method: the prototype was built (`python3 src/build.py`) and opened in a headless browser. Each beat's screen and tab was opened in all four demo scenarios (Meridian "core", Healthcare, Mining, Storage and backup), and `PROCLIB`, `MAT`, `NUM`, `WFX` and `JYX` were read directly. All counts are **prototype facts** measured on 2026-10-19 unless labeled otherwise. Maturity levels shown in the product are **modeled** sample values.

## 1. Where maturity lives in the code (so the rest reads clearly)

| Object | Module | What it holds | Records per process? |
|---|---|---|---|
| Process maturity (`PROCLIB`) | `src/mod_plat_proclib.js` | One computed record per library process: maturity model (`cmmi` by default, or `itil`, `dmm`, `dora`, `nist`, `gai`, `tbm` by family), level, Year 1 target (plus Year 3 and Year 5), and six dimensions scored 0 to 5 from signals in the process: defined, owned, measured, integrated, automated, governed (`PROCLIB.dims`). `PROCLIB.list()` and `PROCLIB.get(id)` return it. | Yes, by construction |
| Capability maturity (`MAT`, rule R26) | `src/mod_mat.js` | 10 maturity models (`MODELS`: asd, pdt, cmmi, itil, tbm, dmm, nist, gai, dora, p3m3) and capabilities with current level, Year 1, 3 and 5 targets, forecast and glide path. `roll()` computes attainment. Every `PROCLIB` process is registered as a capability here (`syncMat`), so the two stay linked. | Yes, for every `PROCLIB` process |
| Workflow drafts (`WFX`) | `src/mod_r28_scn.js` and the journey modules | Editable workflow definitions: id, name, kind, service, owner, standard, steps. Journey boxes link to them. No maturity fields. | No |
| Process numbers (`NUM`) | `src/mod_r32_num_b.js`, data in `src/mod_r32_num_a_data.js` | Stable `P-014` style numbers for both `PROCLIB` processes and `WFX` workflows | n/a |

Rule R26 says every process has a maturity record "on the shared scale (MAT), six dimensions, with a target level". In the code the six dimensions live in `PROCLIB`, and `MAT` holds the matching capability. The check below therefore tests both.

## 2. Beat-to-screen map

Tour: 6 beats, 440 seconds in total (60 + 80 + 60 + 80 + 80 + 80), declared as 8 minutes. Claim chips are as declared in the tour data.

| Beat | Point (declared) | Screen id and name | Tab opened | Module that does it | Exists today | Notes |
|---|---|---|---|---|---|---|
| m.1 Pick | Pick any process and find it by number | `ppl_jrny` Journey maps | Processes | Screen: `src/mod_people.js` (`jrScreen2`, the later registration wins). Tab: `R.procTab` in `src/mod_r31_jxr.js`. Numbers: `src/mod_r32_num_b.js` | Yes | Numbered rows (`P-nnn`); a row opens the process in the designer. Every `PROCLIB` process (311 to 315, depending on screens opened) and every `WFX` workflow (46, 80, 51 and 47 in the four scenarios) has a number. The tab shows no maturity column |
| m.2 Level | Maturity today against target | `exe_mat` Maturity models | None set; the beat says to open "Models and levels" | `src/mod_mat.js` (`MODELS`, `roll()`, screen at the `REG("exe_mat", ...)` call) | Yes | Shows 10 models, 395 capabilities, attainment 74% against 85% (modeled). It is capability maturity, not the six-dimension process record. The spoken line says "self-assessed", but process levels are computed from signals in `assess()`; capability levels are entered or ingested |
| m.3 Evidence | Why that level: a defined measure | `metrics` Measures and targets | None | Core screen defined outside the `mod_` modules (the Screen map data lists `mod_exec.js` as owner); formula chips from `METRICS` | Yes | Opens a metric with owner, formula and baseline. It does not show the six-dimension evidence for a process; that is on the process drawer of `plat_proc` (see gap 6) |
| m.4 Roadmap | Each build's path to a higher level | `r18_mature` Maturity roadmaps | "Maturity roadmaps" (no such tab exists; the screen is the roadmap) | `src/mod_r18c_builds.js` (`matureScreen`) | Yes | 13 builds, average level 2.2 of 5, 11 below target, 2 at or above (modeled). A roadmap per build, not per process. Builds register a process (`ensureProc`, id `r18p_...`), so they do have a `PROCLIB` record |
| m.5 Fix first | What to fix first, in waves | `ppl_jrny` Journey maps | Build list | `src/mod_r31_jzx.js` (Build list, built from the journey boxes) | Yes | Wave logic is labeled hypothesis in the beat |
| m.6 Build | Build the fix from a plain request | `studio` VibeCheck | None | `src/mod_r25_b_studio.js` | Yes | Scripted interview; the beat labels it simulated |

Result of opening all six beats in each scenario: every beat opened without error in core, Healthcare, Mining and Storage and backup, and the tab named in m.1 and m.5 was found each time. The tour forces the Meridian scenario on start (`SCN.set("core")`), so the other three scenarios are not part of the tour today.

### Tenant behavior (R16 to R20)
| Beat screen | Changes with the scenario? | Evidence |
|---|---|---|
| `ppl_jrny` (m.1, m.5) | Yes | Visible text length 3,890 (core), 4,822 (Healthcare), 4,028 (Mining), 4,089 (Storage) |
| `exe_mat` (m.2) | No | 11,410 characters in every scenario: the Meridian capabilities and models |
| `metrics` (m.3) | Almost none | 9,567 characters in three scenarios, 9,687 in Storage |
| `r18_mature` (m.4) | No | 2,170 characters in every scenario: the same 13 Meridian builds |
| `studio` (m.6) | No | 1,239 characters in every scenario |

So four of the six beats show Meridian content in every tenant. That is consistent with the known state of R16 (only Journey maps, Org chart and Build list follow the tenant today) and is the tenant seam DC-03 and CL-55 address.

## 3. Maturity record check for every process

### 3.1 Library processes (`PROCLIB`)
| Check | Result | Label |
|---|---|---|
| Processes in `PROCLIB.list()` at first load | 131 (Meridian) | prototype fact |
| Processes after other screens have wired themselves in | 311 to 315 depending on which screens were opened | prototype fact |
| Processes with a maturity level, a model and a Year 1 target | all of them (0 missing) in every scenario | prototype fact |
| Processes with all six dimensions scored | all of them (0 missing) | prototype fact |
| Processes registered as a `MAT` capability | 131 of 131 at first load | prototype fact |
| Processes below their Year 1 target | 99 of 131 at first load; 194 of 314 after wiring | prototype fact (levels are modeled) |
| Processes with no named owner | 9 at first load (`bud_ben`, `bud_over`, `bud_model`, `bud_doa`, `bud_ven`, `adm_gate`, `tower`, `adm_sec`, `adm_audit`); 0 after wiring | prototype fact |
| Processes with no linked metric | 7 at first load (`itom_graph`, `obs_dash`, `obs_std`, `bud_model`, `bud_doa`, `adm_sec`, `adm_audit`); 0 after wiring | prototype fact |
| Processes with no backup owner | 93 of 131 at first load; 0 after wiring | prototype fact |
| Level mix at first load (models' own scales) | level 1: 81, level 2: 13, level 3: 32, level 4: 5 | prototype fact |
| Source of the 314 after wiring | 68 from connection data, 9 new, 93 from screens, 144 added by modules at first visit | prototype fact |

Observation: the count and several completeness results depend on which screens were visited, because modules add their processes to `PROCLIB` when first opened. A tour that opens `plat_proc` first would show 131 processes with 9 unowned; one that opens it after visiting other screens shows about 314 with none unowned. This is a demo-stability finding for DC-32, not a defect in the record.

### 3.2 Journey-generated drafts (`WFX` workflows linked from journey boxes)
| Scenario | Workflows loaded | Distinct workflows linked from journey boxes | Of those, with a `PROCLIB` maturity record | Numbered (`P-nnn`) |
|---|---|---|---|---|
| Meridian (core) | 46 | 17 (plus 4 library processes) | 0 | 17 of 17 |
| Healthcare | 80 | 45 | 0 | 45 of 45 |
| Mining | 51 | 16 | 0 | 16 of 16 |
| Storage and backup | 47 | 12 | 0 | 12 of 12 |

No `WFX` workflow has a `PROCLIB` record, and no `WFX` definition has a maturity, target or dimension field. The Processes tab of Journey maps states that generated processes "are drafts from the map: manual today, owned, and ready to refine"; it shows an automation level but not a maturity level. Only the 4 library processes (`PROC`) linked from Meridian journeys have maturity records. This means rule R26 is not met for journey-generated drafts.

## 4. Gap list
Each gap is a finding to turn into backlog rows; this document does not track them.

| No. | Gap | Evidence | Relevant IDs |
|---|---|---|---|
| 1 | Journey-generated workflow drafts have no maturity record, dimensions or target (R26) | Section 3.2: 0 of 90 workflow links (17 + 45 + 16 + 12) across four scenarios lead to a record | R26, DC-32, CL-52 |
| 2 | Four of six beats show Meridian content in every tenant | Section 2, tenant behavior | R16, DC-03, CL-55, DC-31 |
| 3 | The process count and ownership results change as screens are opened, so the demo's numbers depend on click order | Section 3.1 | DC-32, DC-05 |
| 4 | m.2 says levels are "self-assessed"; process levels are computed from signals, capability levels are entered | `assess()` in `mod_plat_proclib.js`; m.2 `say` line | DC-32 |
| 5 | m.4 names a tab (`Maturity roadmaps`) that does not exist, so the tab step silently does nothing; m.2 asks to open "Models and levels" but sets no `tab` | tour data; `exe_mat` tabs | DC-32 |
| 6 | No beat uses `plat_proc` (Process library), the one screen that shows a process's six dimensions, written criteria, Year 1 target and gap actions | `src/mod_plat_proclib.js` drawer with radar and ladder | DC-32 (the feature exists, so a beat for it needs no new build) |
| 7 | m.4 is per build (13 builds), while the blurb says "pick a process"; a process picked in m.1 does not carry into m.2 to m.4 | Tour data; `r18_mature` content | DC-32, DC-07 (lens mechanism) |
| 8 | Targets exist for every library process but the record does not say whether a target was set by an owner or defaulted by the platform | `defTargets()` and `MAT.tgtN` in `finish()` | R26, PR-23 |
| 9 | No deep link from a tour beat to a specific process or build | `go` and `tab` only; no argument | DC-05 |

## 5. What was not checked
- Whether the draft tour is acceptable under the 1,200 second cap with any real talk time; `SHOW.lint()` covers it.
- The Org chart and Build list tenant behavior beyond the tab opening.
- Data in the other four tours.
