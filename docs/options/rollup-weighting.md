# Option paper: roll-up weighting and de-duplication across metrics with different units

Backlog item PR-22 (origin: GTM open question of 2026-10-19, COO pitch). This paper compares ways to roll metrics up to an objective, a function or an executive score when the metrics have different units, and ways to stop one dollar, hour or step being counted twice. It ends with a recommendation. It changes no code, carries no status or priority, and is for Omar to accept, change or reject. Numbers in the worked examples are **modeled** and fictional (Meridian Standards Foundation). The rules in section 2 describe the prototype as it is on 2026-10-19 (**prototype fact**); the recommendation is a **hypothesis** until a COO-type reader has tested it.

## 1. The question

A COO or CIO wants one answer per objective, per function or per process family: "are we on track?" The inputs are measures in unlike units: percent, days, dollars, hours, counts, and maturity levels on scales of four or five points. Two problems follow.

1. **Weighting.** How do unlike measures combine into one number, and who decides their relative weight?
2. **De-duplication.** One initiative can serve two objectives, one process can serve many journey steps, one cost center can serve six org units, one agent build can cover several steps. A roll-up that adds these naively counts the same thing more than once and overstates progress, cost or hours released.

Rule R25 requires every number to be a defined metric (owner, formula, target, baseline, remediation), and rule R6 requires one source of truth per value. This paper sets how defined metrics combine.

## 2. What the prototype does today (five patterns)

| No. | Pattern | Where | How it handles units and double counting |
|---|---|---|---|
| 1 | **Dollar split weights that sum to 1** | `src/mod_exec.js`: `LINK0`, `weightsForm`, `coverage()` | Each initiative has contribution weights to the objectives it serves (for example PR1: 80% to O1, 20% to O2). The weights form scales them to add to 100%, so "a request can never count for more than its full cost". `coverage()` caps a request's linked share at 1 (`Math.min(1,lsum)`) and reports funded work with no objective and objectives with no funded work. The alignment score is linked dollars over funded dollars, minus 8 points per uncovered objective |
| 2 | **Normalized progress, equal average** | `src/mod_exec.js`: `krProg`, `objProg` | A key result's progress is (current - start) / (target - start), clamped to 0 to 1, so days, percent and counts all become a fraction. An objective's progress is the plain average of its key results, compared with the average expected progress to date. Status is good, warn or bad by distance from expected |
| 3 | **Leaves only, level rescaled to a five-point scale** | `src/mod_mat.js`: `roll()`, `sc5`, `leaves` | Roll-ups use leaf capabilities only "so nothing is counted twice". Each capability carries a weight `w` (default 1), so the default is an equal weight. Levels on a four-point scale (NIST tiers) or five-point scale are rescaled to 1 to 5 by `sc5`. Attainment is the weighted mean of min(1, current / Year 1 target) |
| 4 | **Ratio of sums, with a minimum sample** | `src/mod_svc.js` line 842: `rollup(it)` | Service-level and operating-level rates are recomputed from counts (`pc(olaN-olaM, olaN)`), not averaged from per-request percentages. A service-level rate is reported only when at least 3 deployed requests exist (`dep.length>=3`), otherwise null. Medians are used for durations |
| 5 | **Many-to-one translation shown once** | `src/mod_r15b_ccmap.js` (cost center to org unit to owner to GL segment) | A cost center shared by several org units (`CC-4420` is shared by six) shows the shared total once and "cannot be split"; the module's own decision text says a many-to-many translation needs a share and an effective date, so it is stored as a separate mapping entity rather than copied |

Observations (prototype fact):
- Every pattern avoids adding raw values across units. Patterns 1 and 4 add only like units (dollars, counts). Patterns 2 and 3 convert to a unitless fraction first.
- Equal weights are the default in patterns 2 and 3. Only pattern 1 lets an owner set weights, and only for the objective link, not for the metrics under an objective.
- The Journey and Build list code counts a different way: the org chart counts one proposed teammate per step, the Build list combines steps per process, so the two FTE totals can differ (`docs/journey-maps-round3.md`, section 8; an open point on the journey handoff). This is a de-duplication gap of the kind this paper addresses.
- No screen shows the roll-up rule next to the number. Pattern 1 comes closest, with a formula line in the key-result drawer.

## 3. Options for weighting across units

| Option | Rule | Strengths | Weaknesses |
|---|---|---|---|
| A. Equal-weight average of normalized attainment | Convert each metric to attainment (current - baseline) / (target - baseline), clamped 0 to 1, direction-aware; average | Simple, explainable in one sentence, already in `objProg` | Ignores importance; one trivial metric offsets a critical one; gaming by adding easy metrics |
| B. Owner-set weights, default equal | As A, but each parent has weights that sum to 100%, set by the parent's owner in a form like `weightsForm`; default equal; the weight source (default or owner-set) is shown | Uses a pattern users already have; reflects judgment; auditable (weights change is an audited action, R35) | Adds a decision per parent; weights drift; two executives may want different weights for the same objective |
| C. Value-weighted | Weight each metric by a modeled dollar or hour value it moves | One common unit, defensible in a budget conversation | Needs a modeled value per metric (more assumptions to label modeled); false precision; punishes metrics that are hard to price |
| D. No single number | Show a scorecard: counts on track, at risk and off track, plus the worst child | Cannot hide a red metric inside an average; no weight argument | Executives asked for one answer; harder to compare across objectives; weak for a roll-up to the top |
| E. Hybrid (A or B for the score, D as guardrail) | Score by B; always show the on-track counts and the worst child beside it; a parent cannot display green while a flagged critical child is red (a floor rule) | The score is comparable and the guardrail protects against averaging away a failure | Slightly more to explain; the floor rule needs a way to flag a child as critical |

## 4. Options for de-duplication

| Option | Rule | Strengths | Weaknesses |
|---|---|---|---|
| i. Split weights summing to 1 (allocation) | Anything that serves several parents carries shares that add to 100%; each parent receives its share of the amount | Totals across parents equal the true total; already in pattern 1; weights are editable and audited | Someone must set the split; defaults must be visible |
| ii. Primary parent only | Each item scores under exactly one parent; other links are references with no score | Simplest; no shares | Misstates shared work; arguments about which parent is primary |
| iii. Count at the leaf, derive upward | Measure hours, dollars and steps at the lowest unique unit (a step, a transaction line); parents are sums or ratios of leaves; ratios recomputed from numerators and denominators | Matches patterns 3 and 4; the same leaf can feed many parents without changing the leaf total | Needs a unique leaf identifier everywhere (see process, step and build numbers, DC-02) |
| iv. Show shared totals once and flag them | Where an item is genuinely shared and cannot be split, show the shared amount once with a "shared" marker | Honest; pattern 5 | Does not produce a per-parent number |

## 5. Worked example (modeled, fictional)

Objective O1 "Modernize standards publishing" has three measures:

| Measure | Unit | Baseline | Today | Target | Attainment |
|---|---|---|---|---|---|
| Time from need to published standard | days | 540 | 500 | 420 | (540 - 500) / (540 - 420) = 33% |
| Reviewer turnaround | days | 9 | 8 | 5 | (9 - 8) / (9 - 5) = 25% |
| Agents under the gateway | count of 6 | 0 | 3 | 6 | 3 / 6 = 50% |

- Option A (equal weights): (33 + 25 + 50) / 3 = 36%.
- Option B with owner weights 50, 30, 20: 0.5 x 33 + 0.3 x 25 + 0.2 x 50 = 34%. The score moved two points, which is the point: weights matter less than visibility. The card shows "weights set by the objective owner" or "equal by default".
- Option E adds "1 of 3 on track, worst: reviewer turnaround", so a reader sees the shape behind 34%.

De-duplication: a $500,000 initiative (modeled) linked 80% to O1 and 20% to O2 contributes $400,000 to O1 and $100,000 to O2. The total across objectives is still $500,000 (option i). A shared cost center is shown once (option iv). Hours released by an agent that covers three journey steps are counted from the three steps once each (option iii), whether the figure is shown on the Build list or on the org chart.

## 6. Recommendation (hypothesis)

Adopt **E for weighting and a combination of i, iii and iv for de-duplication**, expressed as five rules:

1. **Never add unlike units.** Convert each metric to attainment (baseline to target, clamped, direction-aware) before combining, or combine only like units.
2. **Equal weights by default; owner-set weights allowed, shown and audited.** Each parent shows whether its weights are default or set by its owner, and who changed them last.
3. **Always show the guardrail beside the score**: counts on track, at risk and off track, and the worst child. A critical child can be flagged so the parent cannot show green while it is red.
4. **Count once at the leaf.** Hours, dollars and steps are measured at the lowest unique unit and rolled up from there. Ratios are recomputed from sums (numerator over denominator), never averaged. A rate with fewer than a minimum number of cases (3, as in pattern 4) shows "not enough data" instead of a value.
5. **Shared items carry split shares that add to 100%** (pattern 1). Where an item cannot be split, show the shared total once and mark it "shared" (pattern 5).

Why this and not the others: it reuses behavior users already see (patterns 1, 2, 4), keeps the single number executives ask for, and keeps the guardrail that stops an average from hiding a failure. Value weighting (C) is the better long-term answer for budget conversations but needs modeled values per metric, so it is deferred as a later layer rather than a base rule.

What would settle it: show the same objective to two COO-type readers with option A, B and E side by side and record which one they trust and why. This is a test with a buyer and is **not done**.

## 7. Questions this paper leaves open (for Open Questions, not tracked here)
- Who sets the weights in a real organization: the objective owner, the PMO, or the executive team?
- Is a floor rule acceptable to executives, or does it read as overriding their score?
- Is a minimum sample of 3 right for every rate, or should it vary by metric?
- Which count basis does the org chart use once the Build list and org chart totals are unified?
