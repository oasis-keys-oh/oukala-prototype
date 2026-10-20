"""Embeds baseline audit counts and harness results into zlparts/a.js (HARNESS_DATA region), then rebuilds mod_zlink.js."""
import json,re,os,collections
b=json.load(open('scr/before.json'))
H={'before':{'checks':b['checks'],'score':b['score'],'findings':b['findings'],'dead':b['dead'],'deadTotal':b['deadTotal']}}
def load(p):
    return json.load(open(p)) if os.path.exists(p) else None
wb,wa=load('scr/walk_b.json'),load('scr/walk_a.json')
def norm(l):
    v=l.get('verdict')
    if v=='mismatch' and l.get('key','').startswith('data-go=') and ':' in l['key'] and l.get('landed')==l['key'].split('=',1)[1].split(':')[0]: return 'ok'
    return v
def summ(w):
    L=[dict(l,verdict=norm(l)) for l in w['log'] if l.get('verdict') not in ('harness','lost')]
    c=collections.Counter(l['verdict'] for l in L)
    return {'total':len(L),'bad':len([l for l in L if l['verdict']!='ok']),'by':dict(c),'screens':len(set(l['screen'] for l in L))}
if wb and wa:
    H['walk']={'before':summ(wb),'after':summ(wa),'deadList':[{'screen':l['screen'],'txt':(l.get('txt') or l['key'])[:60],'verdict':norm(l),'why':l.get('why','')[:90]} for l in wa['log'] if norm(l) not in ('ok','harness','lost')][:80],
      'beforeList':[{'screen':l['screen'],'txt':(l.get('txt') or l['key'])[:60],'verdict':norm(l),'why':l.get('why','')[:90]} for l in wb['log'] if norm(l) not in ('ok','harness','lost')][:80]}
sb_,sa_=load('scr/scan_b.json'),load('scr/scan_a.json')
if sb_ and sa_:
    H['scan']={'before':{'screens':sb_['screens'],'chips':sb_['chips'],'dead':len(sb_['dead'])},'after':{'screens':sa_['screens'],'chips':sa_['chips'],'dead':len(sa_['dead'])},'deadList':sa_['dead'][:60],'beforeList':sb_['dead'][:60],'byAttr':sa_['byAttr']}
s=open('zlparts/a.js').read()
s=re.sub(r'/\*HARNESS_DATA\*/.*?/\*END_HARNESS_DATA\*/','/*HARNESS_DATA*/'+json.dumps(H,separators=(',',':'))+'/*END_HARNESS_DATA*/',s,flags=re.S)
open('zlparts/a.js','w').write(s)
print('embedded',len(json.dumps(H)),'bytes; walk' in str(H.keys()),list(H.keys()))
