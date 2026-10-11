# Data-link convention (Round 15)

Every clickable reference to a record, person, screen or role uses one attribute and one opener.

## The attribute

`data-link="type:id"`

| type | id is | resolved by |
|---|---|---|
| screen | screen id (optionally `screen:arg`) | `SCREENS` |
| person | the person's display name | `who()` / person 360 |
| record | any id the connectivity universe knows (INC0412, PR1, INV-20433, KB0421) | `ZLINK.universe()` |
| metric, process, workflow, entity, article, invoice, incident, change, problem, project, service, ci, contract, po, vendor, raid, meeting, agent | the record id | `ZLINK.universe()` |
| event | event id in the event catalog | `EVENTS.catalog` |
| role | role name | `R15E.roles` (role registry) |

Rules:
1. One `type:id` per element; the id may contain colons after the first one.
2. The element must be a `button` or `a` (or have `role="button"`), with visible text that names the record.
3. Do not invent a new attribute name for navigation. Legacy attributes (`data-go`, `data-person`, `data-rec`) keep working; the decorator adds `data-link` to them (and `data-link-via` to say which attribute it came from) so the walker sees one convention.
4. New code writes `data-link` directly. The delegated handler in `mod_zlink_r15.js` calls `openRecord(type, id)` for any `data-link` element that has no legacy attribute.

## The opener

`window.openRecord(type, id)` returns true when something opened. `window.DATALINK` exposes `types`, `parse`, `open`, `resolve(type,id)` and `decorate(root)`.

## The walker (CI check)

```
NODE_PATH=$(npm root -g) node zlink_walk.js out_e15/full.html [--screens a,b,c] [--click 2]
```

For every screen (or the listed ones) it renders the screen, decorates legacy attributes, then fails the run (exit code 1) when any `data-link`:
- does not parse as `type:id`, or names a type outside the table above,
- names a record, screen, event or role that does not resolve,
- (with `--click N`) opens nothing when clicked (N per screen).

It prints one line per screen and a summary with the first 40 broken links. Run it after `build.py` and before publishing; `ci_refs.js` is the companion check for reference fields (every `ref` field must declare a target entity).
