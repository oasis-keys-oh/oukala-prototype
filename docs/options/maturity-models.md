# Option paper: reference and maturity models behind capability scoring

Backlog item PR-23 (origin: GTM open question of 2026-10-19). This paper compares ways to source the maturity and reference models behind capability scoring: which models to include, the licence position of each, and whether to build our own. It ends with a recommendation. It changes no code, carries no status or priority, and is for Omar to accept, change or reject.

**This is not legal advice.** The licence statements below are the author's understanding of how each source is generally published and must be confirmed by counsel and, where noted, by the owner of the model before any external use or any customer-facing "aligned with" claim (rules R27 and R33; image provenance is a separate item, BR-05). The prototype is not cleared for external use (BR-01), so nothing here is a published claim.

Code facts are **prototype facts** as of 2026-10-19. Level names and numbers in the product are **modeled** sample values. The recommendation is a **hypothesis**.

## 1. What the prototype does today

Two modules work together:
- `src/mod_mat.js` holds the capability maturity engine (rule R26): 10 models in `MODELS`, a capability tree per model, current level and Year 1, 3 and 5 targets, a glide path, a what-if tool, and two ways to bring in more models: **Ingest a model** (paste or upload a CSV, markdown or similar, with a format guide and a check that warns about levels outside the model's range) and **Build a model** (author levels and capabilities in the product). `roll()` rolls capabilities up using leaves only (see `docs/options/rollup-weighting.md`).
- `src/mod_plat_proclib.js` scores every library process on six dimensions (defined, owned, measured, integrated, automated, governed) from observable signals, then maps the result to the level scale of the process's model (`toModel`). Models are assigned by family (`MODEL_BY_FAM`) or by screen (`MODEL_BY_ID`), defaulting to the CMMI-style model (`cmmi`).

The standards badges (`stdChip`, rule R27) are defined in `src/kit2.js` and `src/mod_mat.js`. The 10 models:

| Id | Model name in the product | Source field | Standard cited | Levels | Content origin |
|---|---|---|---|---|---|
| `asd` | Autonomous service delivery | own | ITIL | 5 | Authored for the sample organization: Manual, Assisted, Partially automated, Agentic with approval, Autonomous within guardrails |
| `pdt` | Project and delivery traceability | own | PMBOK | 5 | Authored: Ad hoc, Recorded, Linked, Verified, Continuous |
| `cmmi` | Process capability (CMMI style) | ingested standard | CMMI (ISACA); ISO/IEC 33020 scale | 5 | Level names Initial, Managed, Defined, Quantitatively managed, Optimizing, with one-line descriptions |
| `itil` | IT service management practices | ingested standard | ITIL (PeopleCert) | 5 | Practice maturity, "ITIL 5 aware (ITIL 4 practices mapped)" per the product text; verify the current edition (R27) |
| `tbm` | Technology business management | ingested standard | TBM Taxonomy (TBM Council) | 5 | Cost traceability levels |
| `dmm` | Data management | ingested standard | labeled "DAMA DMM" in the product | 5 | Levels across DMBOK knowledge areas |
| `nist` | Cybersecurity (NIST CSF 2.0 tiers) | ingested standard | NIST CSF 2.0 | 4 | Four tiers, treated as a four-level scale |
| `gai` | AI governance | ingested standard | labeled "Gartner, MITRE and Microsoft (blended)" | 5 | Keeps "the five Gartner stage names" and adds governance criteria from MITRE and Microsoft models, per the product text |
| `dora` | Software delivery (DORA) | ingested standard | DORA metrics | 4 | Performance clusters and the four key metrics plus rework |
| `p3m3` | Portfolio management (P3M3) | ingested standard | P3M3 (PeopleCert, formerly Axelos) | 5 | Awareness, repeatable, defined, managed, optimized |

Two of ten models are authored by the product team; eight are labeled "ingested standard". The per-process scale is computed by the platform from six dimensions and then mapped, so the six dimensions are the product's own contribution and are independent of any external model.

## 2. Licence position by source (understanding to confirm)

| Source | Owner (as understood) | Generally available how | Position for shipping content in a product | Risk |
|---|---|---|---|---|
| CMMI | ISACA (acquired the CMMI Institute in 2016); the name CMMI is a registered mark | Model published through ISACA; official appraisals and ratings run through ISACA-authorized partners | Describing a "CMMI style" five-step capability scale in our own words is lower risk; copying model text, using the mark as if certified, or implying an appraisal is higher risk | Medium. The level names above match the published ones and the one-line descriptions are close paraphrases; counsel should review before external use |
| ISO/IEC 33020 and the 33000 series | ISO and IEC | Purchased standards, copyrighted | The idea of capability levels 0 to 5 can be described; the standard's text cannot be reproduced; buying one copy does not license redistribution | Low if paraphrased, high if text is copied |
| COBIT 2019 | ISACA | Copyrighted; capability levels based on ISO/IEC 33020 | Not in the product today. Same position as CMMI | Not applicable now |
| ITIL (including its maturity assessment) | PeopleCert (formerly Axelos) | Copyrighted publications; the name ITIL is a registered mark | Paraphrase only (rule R33 already says so); no level text copied | Medium, because the maturity content is a commercial assessment product |
| P3M3 | PeopleCert (formerly Axelos) | Copyrighted; assessments through accredited bodies | Same as ITIL | Medium |
| NIST CSF 2.0 | NIST, a US government agency | Published free; US government works are generally not subject to copyright in the US | Safe to use the Functions and outcomes with attribution. NIST states that its Tiers are not maturity levels, so labeling them as a maturity scale is a naming risk, not a licence risk | Low licence risk; fix the label |
| TBM Taxonomy | TBM Council | Published free by the TBM Council under its own terms | Check the licence terms of the version used before reuse; the product cites the taxonomy by name | Low to medium; confirm terms |
| DORA metrics and clusters | DORA research program (Google Cloud) | Annual report free to read; copyrighted | The four key metrics are facts and ideas that can be described; do not copy report text or charts | Low |
| "DAMA DMM" | The product attributes the Data Management Maturity levels to DAMA International. As understood, DAMA publishes the DMBOK and the Data Management Maturity Model name is associated with the CMMI Institute (now ISACA) | n/a | Attribution in the product may be wrong; verify before any external use | Medium: a wrong attribution is a credibility problem as well as a rights question |
| Gartner AI maturity model | Gartner, proprietary research behind a subscription | Not free | The product says it keeps Gartner's five stage names. Using a vendor's proprietary stage names inside a product is the highest-risk row here | High |
| MITRE AI maturity model; Microsoft AI maturity materials | MITRE; Microsoft | Published free; copyright retained | Criteria can be cited and paraphrased; do not copy tables | Low to medium |
| Own models (`asd`, `pdt`) | The product | n/a | No external rights involved | None |

Two further reference frameworks may be asked for by buyers and are not in the product: TOGAF (The Open Group) and the APQC Process Classification Framework. Both are widely referenced and each has its own terms; they are named here only so the same review covers them if added.

## 3. Options

| Option | Description | Strengths | Weaknesses |
|---|---|---|---|
| 1. Build our own scale only | One Falconaire maturity scale (five levels, six dimensions) with product-authored models for each domain | No licence exposure; fully consistent with R26 (no parallel scales); the six-dimension scoring already exists | Buyers ask "which standard?"; no external credibility; effort to write good domain models |
| 2. License and ship the standard models | Obtain commercial terms from ISACA, PeopleCert, Gartner and others and ship their models | Recognized names; buyers recognize the levels | Fees and OEM terms are unknown; per-model negotiation; terms may forbid embedding or require assessors; lock-in to each owner's editions and revisions |
| 3. Bring your own | The customer ingests the models it has licensed (the existing Ingest a model feature); the product ships none of the proprietary content | No redistribution of third-party content; scales with whatever the customer already owns | Empty first-run experience; the demo needs sample content anyway |
| 4. Hybrid (own scale and crosswalk, open sources, bring your own) | Ship an own scale and own models; ship open or public-domain sources (for example NIST CSF outcomes, DORA metrics described in our words); allow a labeled crosswalk to proprietary models ("comparable to level 3 of model X as published by its owner") only after counsel review; let customers ingest licensed content | Avoids redistributing proprietary text while keeping recognized vocabulary available; matches existing features | The crosswalk needs maintenance and legal review; "aligned with" claims need care |

## 4. Recommendation (hypothesis)

Adopt **Option 4**, in these concrete steps, in this order of risk:

1. **Keep one shared scale (R26) and make the six dimensions the product's own method.** The six-dimension scoring in the process library is already product-authored and independent of any external model; present it that way.
2. **Ship only content that is authored by us or open.** Keep `asd` and `pdt`. Keep NIST CSF as an outcomes-based model but relabel "tiers" so it does not claim to be a maturity scale. Keep DORA as a metric set described in our words.
3. **Remove or replace the highest-risk content before any external use**: the Gartner stage names in `gai` (replace with product-authored stage names, cite MITRE and Microsoft criteria as sources), and the "DAMA DMM" attribution in `dmm` (verify and correct).
4. **For CMMI, ITIL and P3M3, keep the models as "style" or "aligned" scales with our own level text, and do not display the owner's mark as if certified.** Confirm with counsel whether the current level names and one-line descriptions are acceptable, and whether to approach ISACA and PeopleCert about reference or partner terms.
5. **Make bring your own the route to the real thing.** A customer that licenses a model ingests it into its own tenant; the tenant owns that content, and it never appears in another tenant (R16, R49).
6. **Crosswalk shape.** Store crosswalks as translations with a share and an effective date, the same shape `src/mod_r15b_ccmap.js` uses for cost-center-to-org-unit mapping, so a Falconaire level can map to a range of levels on an external model and be re-mapped when the owner revises the model.

Why not 1 alone: buyers and auditors will ask which standard the levels follow, and the product already cites standards on every screen (R27). Why not 2: unknown fees and terms, and most owners' terms are designed for assessors and consultancies, not for embedding. Why not 3 alone: the first-run and demo experience would be empty.

What would settle it (not done): (a) counsel review of the table in section 2, row by row; (b) a short inquiry to ISACA and PeopleCert about OEM or reference terms; (c) asking two COO-type buyers whether a "comparable to" crosswalk satisfies the "which standard?" question or whether they require the owner's own assessment.

## 5. Relationship to other items
- Roll-up of scores across models with different level counts: `docs/options/rollup-weighting.md` (the `sc5` rescale to five points is the current method).
- The Showroom maturity tour and its gaps: `docs/inventory/maturity-tour-map.md` (DC-33, DC-32).
- The Platform Rules that govern this: R26 (one scale, six dimensions), R27 (name the standard), R33 (intellectual-property clean).

## 6. Questions this paper leaves open (for Open Questions, not tracked here)
- Is a labeled "comparable to" crosswalk acceptable to Omar as the customer-facing way to reference a proprietary model?
- Who owns the legal review, and when: before the first external demo, or before the first pilot?
- Should a customer's ingested licensed model be exportable, or locked to its tenant?
