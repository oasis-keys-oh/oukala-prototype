from common import *
from epics import *
VER_REG='script spec/extract_registry.js (PLAT.entities) plus schema test'
CLS_MASK={'restricted','personal','confidential'}
TYPE_AC={
 'string':'a single-line text value, trimmed; empty string is stored as null',
 'text':'free text with no length truncation on save',
 'ref':'the id of an existing record in the target entity',
 'reference':'the id of an existing record in the target entity',
 'person':'the id of an existing person record',
 'enum':'one value from the declared option list',
 'choice':'one value from the declared option list',
 'select':'one value from the declared option list',
 'datetime':'an ISO 8601 date-time with time zone, stored in UTC',
 'date':'an ISO 8601 calendar date',
 'duration':'a duration stored in whole minutes',
 'number':'a number; non-numeric input is rejected',
 'num':'a number; non-numeric input is rejected',
 'boolean':'true or false only',
 'bool':'true or false only',
 'currency':'a decimal amount with a currency code, two decimal places',
 'money':'a decimal amount with a currency code, two decimal places',
 'percent':'a number from 0 to 100 shown with a percent sign',
 'list':'an ordered list of values; each element is validated against its item type',
 'json':'a JSON object that parses and is stored without loss',
}
def type_ac(t):
    if not t: return None
    base=t.split(':')[0]
    return TYPE_AC.get(base)
def ent_owner(e):
    return OWN_OF['ents'].get(e['id']) or e.get('steward') or e.get('owner') or ''
def ent_backup(e):
    return ''
def pri_for_class(cls,live,key):
    if not live: return 'P3'
    if cls in ('restricted','personal'): return 'P0' if key else 'P1'
    if cls=='confidential': return 'P1'
    return 'P1' if key else 'P2'

def entity_rows():
    for e in R['entities']:
        eid=e['id']; live=(e['lifecycle']=='live' and not e['proposed'])
        mod='DATA'; ep=en(data_epic(e.get('domain')))
        steward=e.get('steward') or ''; owner=OWN_OF['ents'].get(eid) or steward
        flds=e['fields']; nf=len(flds)
        classes=collections.Counter(f.get('classification') or 'unclassified' for f in flds)
        auth=collections.Counter(f.get('authority') or 'undeclared' for f in flds)
        refs=sorted({f['ref'] for f in flds if f.get('ref')})
        st='Built' if live else 'Partial'
        base=dict(screen_id='',screen_name='',owner=owner,backup='none named (steward '+(steward or 'n/a')+')',data=eid,verified=VER_REG,source='registry')
        add(mod,ep,'Data','P1' if live else 'P3',f"Store the entity '{e['label']}' ({eid}) with {nf} fields in the {e.get('domain')} domain.",
            ac(f"Given the schema, then {eid} has exactly the {nf} declared fields with the declared types.",
               f"Given the entity record, then owner is '{e.get('owner') or 'n/a'}' and steward is '{steward or 'unassigned'}'.",
               f"Given lifecycle '{e['lifecycle']}', then the entity is {'available to production features' if live else 'created behind a proposal flag until the steward approves'}.",
               "Given a duplicate entity is proposed, then the integration decision (reuse, alias, new) is recorded before creation."),
            pos='',spc='',exp=f"Registry status {e.get('status')}; {len(e.get('readers') or [])} reader module(s), {len(e.get('writers') or [])} writer module(s).",
            persona=f"Classification {e.get('cls')}; see field rules.",status=st,key='DATA:'+eid,
            notes=(e.get('note') or '')[:240],**{k:v for k,v in base.items() if k not in ('screen_id','screen_name')})
        add(mod,ep,'Security',pri_for_class(e.get('cls'),live,True),f"Classify '{eid}' as {e.get('cls') or 'unclassified'} and apply its handling rules.",
            ac(f"Given the entity, then its classification is {e.get('cls') or 'unclassified'} and every field is classified (field classes: {', '.join(f'{k} {v}' for k,v in classes.items())}).",
               f"Given classification {e.get('cls')}, then {'values are masked for personas without a read grant and every reveal is logged' if e.get('cls') in CLS_MASK else 'values are visible to any persona that may read the entity'}.",
               "Given a field without classification, then a save of the schema is rejected.",
               "Given an export, then classification travels with the data."),
            persona=f"Readers: {lst(e.get('readers'),8)}; writers: {lst(e.get('writers'),8)}.",
            status='Built' if not classes.get('unclassified') and live else 'Partial',deps=['DATA:'+eid,'SECU:field-rules'],
            **{k:v for k,v in base.items() if k not in ('screen_id','screen_name')})
        add(mod,ep,'Operations',('P1' if (e.get('cls') in CLS_MASK and live) else 'P2') if live else 'P3',f"Retain '{eid}' records for {e.get('ret') or 'a retention period to be declared'}.",
            ac(f"Given a record older than the retention period ({e.get('ret') or 'undeclared'}), then it is archived or deleted by the retention job.",
               "Given a legal hold on a record, then the retention job skips it and logs the skip.",
               "Given deletion, then an audit entry records who or what removed it and why.",
               f"Given retention is undeclared, then the entity cannot move from proposed to live." if not e.get('ret') else "Given a retention change, then it needs approval from the steward."),
            status='Built' if e.get('ret') and live else ('Partial' if e.get('ret') else 'Gap'),deps=['DATA:'+eid],
            **{k:v for k,v in base.items() if k not in ('screen_id','screen_name')})
        if refs:
            add(mod,ep,'Data','P2' if live else 'P3',f"Enforce reference integrity from '{eid}' to {lst(refs,8)}.",
                ac(f"Given a record of {eid}, when a reference field points to a missing record, then the save is rejected naming the field.",
                   f"Given a target record is deleted, then {eid} records that reference it are blocked, nulled or cascaded as declared per field.",
                   f"Given the reference targets {lst(refs,8)}, then each target entity exists in the registry (dangling targets are reported)."),
                status='Built' if all(r in ENT for r in refs) and live else 'Partial',
                notes='' if all(r in ENT for r in refs) else 'Unresolved targets: '+lst([r for r in refs if r not in ENT]),deps=['DATA:'+eid],
                **{k:v for k,v in base.items() if k not in ('screen_id','screen_name')})
        # field rows
        for f in flds:
            k=f['k']; t=f.get('type'); cls=f.get('classification'); au=f.get('authority')
            ta=type_ac(t)
            is_key=bool(f.get('ref')) or bool(f.get('req')) or k in ('id','number','name','status')
            masked=cls in CLS_MASK
            items=[f"Given a value, then {eid}.{k} stores {ta or 'a value of the type the steward declares'}.",
                   f"Given the field is {'required' if f.get('req') else 'optional'}, when empty on save, then {'the save is rejected naming the field' if f.get('req') else 'the save succeeds'}."]
            if f.get('ref'):
                items.append(f"Given a value, then it must be the id of an existing '{f['ref']}' record; otherwise the save is rejected.")
            if t in ('enum','choice','select') or f.get('opts'):
                items.append(f"Given the option list ({f.get('opts') or 'declared'} options), then values outside the list are rejected.")
            items.append(f"Given classification {cls or 'unclassified'}, then {'the value is masked for personas without a read grant and reveals are logged' if masked else 'the value is visible to personas that can read the entity'}.")
            items.append(f"Given authority {au or 'undeclared'}, then {'the value is written only by '+('the external system of record; manual edits are blocked' if au=='external' else 'the platform' if au=='platform' else 'the owning module and the source system under the conflict rule') if au else 'the steward declares who may write it before go-live'}.")
            if f.get('ext'): items.append(f"Given the field is fed by an external source{'' if f['ext'] is True else ' ('+str(f['ext'])+')'}, then the sync writes this field and records lineage.")
            gap=(not t) or (not cls) or (not au)
            add('DATA',ep,'Data',pri_for_class(cls,live,is_key) if not gap else ('P1' if live else 'P3'),
                f"Store field {eid}.{k} ('{f.get('label')}') as {t or 'an undeclared type'}{', required' if f.get('req') else ''}.",
                ac(*items),
                data=f"{eid}.{k}; type {t or 'undeclared'}; classification {cls or 'undeclared'}; authority {au or 'undeclared'}; reference {f.get('ref') or 'none'}; retention {e.get('ret') or 'undeclared'}",
                persona=f"Class {cls or 'unclassified'}",owner=owner,backup='none named',status=('Gap' if gap else ('Built' if live else 'Partial')),
                verified=VER_REG,source='registry',deps=['DATA:'+eid],
                notes=('Missing in registry: '+', '.join(x for x,v in (('type',t),('classification',cls),('authority',au)) if not v)) if gap else '',key=f'FLD:{eid}.{k}')
