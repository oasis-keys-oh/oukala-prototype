# 10. Events, rules and integrations

Modules talk through 97 named events, 59 rules react to them, and 13 connectors and 16 tools carry data in and out.

Counts were read from `EVENTS`, `NTFX`, `FAB`, `MCPX` and the import wizard of the build `out_v16b`.

## 10.1 Event catalog

An event has a name in the form `object.verb`, an owning module, a payload and a named owner. The catalog holds 97 events across about 30 modules, and 94 have an owner (coverage 99 percent).

| Module | Events | Module | Events |
|---|---|---|---|
| Resilience (`bc_home`) | 18 | Org chart | 9 |
| Dashboards | 7 | Approvals | 6 |
| Workflow runs | 6 | About 25 other modules | 51 |

The firing log holds about 122 entries. Requirements: see OK-EVT-001 to OK-EVT-nnn (register filter: Module=EVT).

## 10.2 Event categories

| Category | Events |
|---|---|
| Lifecycle | `person.created`, `person.updated`, `person.terminated`, `person.moved`, `person.employment_type_changed`, `person.status_changed`, `vacancy.opened`, `vacancy.filled`, `vacancy.closed` |
| Decision | `decision.approved`, `decision.rejected`, `decision.deferred`, `decision.delegated`, `approval.requested`, `approval.escalated`, `approval.group_decided`, `approval.level_decided` |
| Workflow | `workflow.started`, `workflow.step.completed`, `workflow.step.failed`, `workflow.completed`, `workflow.cancelled`, `workflow.sla.breached`, `workflow.notify` |
| Security | `permission.changed`, `access.denied`, `data.revealed` |
| Resilience | 18 `bcdr.*` events |

## 10.3 Rule model

A rule is data: a trigger event, optional conditions, one action and an owner. Rules persist in `STORE` and can be disabled without deleting. The build holds 59 rules and all are enabled.

| Action | Rules |
|---|---|
| notify | 42 |
| call_connector | 10 |
| create_task | 5 |
| update_record | 5 |
| start_workflow | 3 |
| webhook | 1 |

The action counts add to 66 because a rule may carry more than one action. A rule that calls a connector runs under the connector's allowed scope.

## 10.4 Notification registry

The registry lists 24 notification types. Each type names its event, its default recipients by role and its channels.

| Channel | Note |
|---|---|
| In-app | Always on; feeds the bell |
| Email | Simulated in the prototype |
| Teams | Simulated |
| SMS | Simulated |
| Push | Simulated |

A person sets preferences per type. Delivery details are in section 3.7.

## 10.5 Connectors and the fabric

The integration fabric holds 13 connectors, for example Microsoft Graph, Entra ID, Jira Cloud, a lease subledger and a search server. Each connector declares its entities, direction, schedule, authority per field and a quarantine rule.

| Measure | Value |
|---|---|
| Connectors | 13 |
| Runs | 176 |
| Quarantined records | 8 |
| Edition | Fabric |
| Edition limits | 15 connectors, 2 environments, 100,000 runs |

Other editions: Core allows 3 connectors and 1 environment; Fabric Enterprise allows 60 connectors and 5 environments. A record that fails validation goes to quarantine with a reason and an owner, never into the entity. Conflicts follow the rule on the field (section 6.2).

## 10.6 MCP tool list

The platform exposes 16 tools to coding clients and agents. Tools return only what the caller's persona may read.

| Tool | Use |
|---|---|
| `search_registry`, `get_entity`, `check_reuse` | Find and reuse entities |
| `get_policy`, `validate_manifest` | Check a draft against rules |
| `request_exception` | Raise a waiver |
| `list_connectors`, `get_connections`, `get_connectivity` | Read integration state |
| `run_conformance`, `run_feature_contract` | Run checks |
| `find_owner`, `trace_metric` | Resolve ownership and lineage |
| `get_record`, `list_records`, `list_approvals` | Read data |

## 10.7 Import wizard

Eleven foundation sheets load customer data: upload, map columns, validate, dry run, error report, commit. A batch is stored as `import_batch`. The dry run reports errors before any write.

## Known gaps

1. Every connector is simulated; no live call leaves the page.
2. 8 records sit in quarantine and 3 events have no owner.
3. Email, Teams, SMS and push delivery are simulated.
4. Rules have no simulation mode that shows the effect before enabling.
5. MCP tools run against the in-page state, not a hosted server.

Register filter: Module=EVT (10.1 to 10.4), Module=INT (10.5 to 10.7).
