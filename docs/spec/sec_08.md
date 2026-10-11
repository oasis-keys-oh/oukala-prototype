# 8. Metrics and maturity

Every number on screen is a defined metric with an owner, a formula, a start value, a current value and a change, and every process is scored against a maturity model.

Counts were read from `METRICS`, `MX`, `MAT`, `DASHX` and `R15R` in the build `out_v16b`. Values are as of 6 October 2026.

## 8.1 Metric Definition Standard

A metric is not registered until it has the fields below. The registry holds 381 metrics and all of them have an owner and a formula.

| Field | Rule |
|---|---|
| Name and id | One id; the name is a noun phrase |
| Formula | Written out, with source entities and fields |
| Owner and backup | Two named humans |
| Target and direction | Higher or lower is better |
| Unit and format | Money, percent, count, days |
| Baseline | Start value and its date |
| Remediation | What to do when the gap is open |
| Maturity record | Level on the metric maturity scale |

Metrics come from four groups: directory (up to 235), removal and SOP (226), knowledge (59) and agents (96). Requirements: see OK-MET-001 to OK-MET-nnn (register filter: Module=MET).

## 8.2 Lineage and baseline

Each metric chip opens a box with four values. The box states where the value comes from.

| Value | Meaning |
|---|---|
| Start | Baseline: first trend value, or an explicit base set by the owner |
| Now | Latest value at the as-of date |
| Change | Now minus Start, with direction |
| Gap | Distance to target |

Lineage runs from the chip to the formula, the source entity, the field and the owner. The "Why am I seeing this" dialog shows the same path. A formula wraps inside the popover and has a Copy button.

## 8.3 Current position

| Measure | Value |
|---|---|
| Metrics with a trend | 381 |
| Better than baseline | 208 |
| Worse than baseline | 128 |
| Flat | 45 |
| Meeting target | 115 |

Meeting target is 30 percent of metrics. A worse trend with no remediation shows as an open gap in the Feature Contract.

## 8.4 Maturity models and levels

Ten maturity models are registered. Each defines dimensions, five levels and guidance questions.

| Code | Model | Code | Model |
|---|---|---|---|
| asd | Agile software delivery | tbm | Technology business management |
| pdt | Product delivery | dmm | Data management |
| cmmi | Capability maturity | nist | Security framework |
| itil | Service management | gai | Generative AI |
| dora | Delivery performance | p3m3 | Portfolio, programme and project |

The process scale scores six dimensions: defined, owned, measured, integrated, automated and governed. Levels are 1 Initial, 2 Managed, 3 Defined, 4 Quantitatively managed, 5 Optimizing. Average process maturity is 2.7, and 148 processes are below their target. The resilience programme uses its own scale (section 12).

## 8.5 Dashboards and the layout engine

`DASHX` lets a person arrange tiles on a grid, save the layout and share it. The tile library holds 406 items: metrics, charts, tables and lists.

1. A person builds a personal dashboard by adding tiles from the library.
2. A person may save a personal copy of any dashboard.
3. An owner publishes a layout; a decision rule can make it a default for a role.
4. Each save writes history, so a layout can be restored.
5. Tiles follow the card rules in section 4 and use equal heights within a row.

## 8.6 Saved charts

The build holds 5 saved charts, for example SC-001 Forecast variance by category. A saved chart stores its measure, dimension, filter and type. It can be added to any dashboard or report. Publishing needs the owner; a viewer sees the chart under their own data permissions.

## 8.7 Semantic layer

`R15R` defines measures and dimensions once, so reports share one meaning.

| Part | Count | Examples |
|---|---|---|
| Measures | 12 | approved, committed, actual, forecast, variance, orders, receipts, invoices, paid, GRNI, hours, labor |
| Dimensions | 10 | project, category, department, owner, vendor, PO status, PO month, person, week, sheet status |
| Reports | 3 | Built on the measures and dimensions |
| Schedules | 2 | Weekly, Monday 08:00; roles executive and finance |

A report cannot define its own formula for a shared measure. If two reports disagree, the semantic layer wins.

## 8.8 Report scheduling

A schedule names a report, a cadence, recipient roles, a channel and a format. The two schedules use the Email channel and a Table plus CSV format. Delivery is simulated in the prototype; no mail leaves the page. A schedule runs under the owner's permission, so masked data stays masked.

## Known gaps

1. 128 metrics are worse than baseline and 45 are flat; only 115 meet target.
2. 148 processes are below target maturity.
3. Report delivery is simulated; no email service is connected.
4. Only 3 reports and 2 schedules exist on the semantic layer.
5. Some baselines use the first trend value rather than a value the owner set.
6. The metric groups overlap (directory, removal and SOP, knowledge, agents), so group counts do not sum to 381.

Register filter: Module=MET (8.1 to 8.3, 8.5 to 8.8), Module=MAT (8.4).
