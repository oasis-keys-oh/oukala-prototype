"""Build Falconaire. Usage: python3 src/build.py [--out DIR] [--full] [--only mod_a,mod_b]
Core files are always included. Feature modules are mod_*.js and mod_*.css in this folder, in src/modules.json order.
--out   writes the split build to DIR (docs/bundle.md):
          index.html                 the shell: boot screen, one stylesheet link, one script
          assets/style.<hash>.css    all CSS (CL-14)
          assets/app.<hash>.js       core, the first-paint modules (FIRST below) and the boot (CL-15)
          assets/rest.<hash>.js      every other module, loaded right after first paint (CL-15)
          assets/data/<name>.<hash>.json   on-demand data, fetched when its screen first opens (CL-39)
          assets/<image>.<hash>.<ext>      images the CSS references as url(assets/...) (CL-28)
          oukala-js.js               the whole script in one file (not shipped; kept for tools that read it)
          hero/ and journey/         image folders, copied as they are
--full  also writes full.html (one self-contained page, used by tools/tests) and oukala.html (inline fragment).
        full.html inlines everything, embeds the on-demand data and runs every module in one script, as before.
--only  limits which modules are included (use this to test one module in isolation)."""
import sys,os,glob,json,base64,hashlib,shutil,re
here=os.path.dirname(os.path.abspath(__file__));os.chdir(here);sys.path.insert(0,here)
from tokens import block
a=sys.argv[1:];only=None;out='.';full='--full' in a
if '--only' in a: only=set(x.strip() for x in a[a.index('--only')+1].split(',') if x.strip())
if '--out' in a: out=a[a.index('--out')+1]
os.makedirs(out,exist_ok=True)
r=lambda f:open(f,encoding='utf-8').read()
H=lambda b:hashlib.md5(b if isinstance(b,bytes) else b.encode('utf-8')).hexdigest()[:10]
# CL-16: module order comes from modules.json, not from filename sort; mismatches fail the build
mods=json.load(open('modules.json',encoding='utf-8'))['modules']
_disk=set(os.path.splitext(f)[0] for f in glob.glob('mod_*.js')+glob.glob('mod_*.css') if not os.path.splitext(f)[0].endswith(' 2'))  # quarantined ' 2' duplicates (CL-07) are never built
_dup=sorted(set(m for m in mods if mods.count(m)>1))
_missing=sorted(_disk-set(mods));_gone=[m for m in mods if m not in _disk]
if _dup or _missing or _gone:
    if _missing: sys.stderr.write('BUILD FAILED: module files not listed in src/modules.json (add each name to "modules"; see the _about notes there): '+', '.join(_missing)+'\n')
    if _gone: sys.stderr.write('BUILD FAILED: src/modules.json lists modules with no .js or .css file: '+', '.join(_gone)+'\n')
    if _dup: sys.stderr.write('BUILD FAILED: src/modules.json lists a module twice: '+', '.join(_dup)+'\n')
    sys.exit(2)
if only is not None: mods=[m for m in mods if m in only or m.replace('mod_','') in only]

# CL-15: the split build can load the JS in two parts: assets/app.<hash>.js (core, the modules in modules.json up to and including
# FIRST_UNTIL, and the boot in screens3.js) and assets/rest.<hash>.js (the later modules), fetched right after first paint.
# FIRST_UNTIL=None keeps one script. It is None on purpose: measured on 2026-10-20, running any module after the boot changes what
# screens show (counts, owners, glide-path index), because modules compute and cache shared state while they load. Details and the
# way forward: docs/bundle.md. Try a split with --first-until <module> (for example --first-until mod_s_tenant_screens, the last
# module the wedge needs) and check it with node tools/tests/bundle.js <dir> build_out.
# BEGIN FIRST (set by tools/tests/bundle_plan.js --write)
FIRST_UNTIL=None
# END FIRST
if '--first-until' in a:
    _v=a[a.index('--first-until')+1];FIRST_UNTIL=None if _v in ('all','none','') else _v
_all=json.load(open('modules.json',encoding='utf-8'))['modules']
if FIRST_UNTIL is not None and FIRST_UNTIL not in _all: sys.stderr.write('BUILD FAILED: --first-until names '+FIRST_UNTIL+', which is not in src/modules.json\n');sys.exit(2)
FIRST=set(_all if FIRST_UNTIL is None else _all[:_all.index(FIRST_UNTIL)+1])

fonts='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap" media="print" onload="this.media=\'all\'"><noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap"></noscript>'
core=["platform.js","data.js","data2.js","ui.js","kit.js","kit2.js","screens1.js","screens2.js","screens4.js"]
BR=json.load(open('brand.json'));NAME=BR['name'];OLD=BR['replace'];MK=BR.get('mark','')
BRANDJS='window.BRAND=Object.freeze('+json.dumps({'name':NAME,'mark':MK})+');\n'
RUNTIME=r('assets/runtime/bundle.js')  # BUNDLE: app:ready (CL-37), first-paint guard (CL-15), on-demand data (CL-39)
def brandify(js):
    # CL-17: no global name swap any more; view code reads BRAND.name. Only the header wordmark marker in screens3.js is filled in here.
    js=js.replace('<b>'+OLD+'</b><small>','<b>'+NAME+'</b><small>')
    if MK and MK.lower() in NAME.lower():
        _i=NAME.lower().index(MK.lower());WM=NAME[:_i]+'<i class="wm-ai">'+NAME[_i:_i+len(MK)]+'</i>'+NAME[_i+len(MK):]
        js=js.replace('<b>'+NAME+'</b><small>','<b class="wm">'+WM+'</b><small>')
    return js
MODIDX={m:i for i,m in enumerate(mods)}
def modjs(ms):  # BUNDLE._mod(i) marks where module i (its place in modules.json) starts; tools/tests/bundle_plan.js probes there
    return ''.join('\n;BUNDLE._mod(%d);\n/* ===== %s ===== */\n'%(MODIDX[m],m)+r(m+'.js') for m in ms if os.path.exists(m+'.js'))
CORE='\n'.join(r(f) for f in core)
S3=r("screens3.js")

# CL-39: on-demand data. Each src/assets/data/<name>.json is embedded in full.html and fetched by the split build.
DATA={os.path.splitext(os.path.basename(f))[0]:open(f,'rb').read() for f in sorted(glob.glob('assets/data/*.json'))}

def cfg(o): return 'window.__BUNDLE_CFG='+json.dumps(o,separators=(',',':'),ensure_ascii=False)+';\n'
def embedded_cfg():
    return 'window.__BUNDLE_CFG={"split":false,"embedded":{'+','.join(json.dumps(n)+':'+DATA[n].decode('utf-8').strip() for n in DATA)+'}};\n'

# ---- CSS (CL-14, CL-28) ----
css=[r("style.css"),r("style2.css"),r("style3.css"),r("style4.css"),r("style5.css"),r("style6.css"),r("style7.css")]+([r("style8.css")] if os.path.exists("style8.css") else [])+[r(m+'.css') for m in mods if os.path.exists(m+'.css')]
CSS=block()+'\n'+"\n".join(css)
# url(assets/<file>) in module CSS names a file in src/assets: inlined as a data URI in full.html, a hashed file next to the stylesheet in the split build
CSSURL=re.compile(r'url\((["\']?)assets/([\w./-]+)\1\)')
MIME={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.gif':'image/gif'}
def css_inline(s): return CSSURL.sub(lambda m:'url(data:'+MIME[os.path.splitext(m.group(2))[1].lower()]+';base64,'+base64.b64encode(open('assets/'+m.group(2),'rb').read()).decode()+')',s)
cssfiles={}
def css_split(s):
    def sub(m):
        src='assets/'+m.group(2);b=open(src,'rb').read();base,ext=os.path.splitext(os.path.basename(src));name=base+'.'+H(b)+ext
        cssfiles[name]=src;return 'url('+name+')'
    return CSSURL.sub(sub,s)

# ---- brand images inlined in the shell ----
FAV_ICO='<link rel="icon" type="image/x-icon" sizes="16x16 32x32 48x48" href="data:image/x-icon;base64,'+base64.b64encode(open('assets/brand/favicon.ico','rb').read()).decode()+'">'
FAV='<link rel="icon" type="image/png" href="data:image/png;base64,'+base64.b64encode(open('assets/brand/favicon.png','rb').read()).decode()+'"><link rel="apple-touch-icon" href="data:image/png;base64,'+base64.b64encode(open('assets/brand/apple-touch-icon.png','rb').read()).decode()+'">'+FAV_ICO
# BR-11: the boot screen shows the gold falcon mark (AI-generated imagery: BR-05 provenance applies before external use)
BOOTLOGO='<img alt="" width=60 height=56 style="display:block;margin:0 auto 10px;object-fit:contain" src="data:image/webp;base64,'+base64.b64encode(open('assets/brand/mark-gold.webp','rb').read()).decode()+'">'

# ---- full build: one script, everything inline (tools/tests load full.html) ----
js=brandify(BRANDJS+embedded_cfg()+RUNTIME+'\n'+CORE+'\n;BUNDLE._core();'+modjs(mods)+'\n;BUNDLE._shell();\n'+S3+'\n;BUNDLE._done();\n')
html=f'<title>{NAME}</title>{FAV}\n{fonts}\n<style>\n{css_inline(CSS)}\n</style>\n<script>\n{js}\n</script>\n'
open(os.path.join(out,'oukala-js.js'),'w',encoding='utf-8').write(js)
if full:
    open(os.path.join(out,'oukala.html'),'w',encoding='utf-8').write(html)
    open(os.path.join(out,'full.html'),'w',encoding='utf-8').write('<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>:root{color-scheme:light}body{margin:0}</style></head><body>'+html+'</body></html>')

# ---- split build: shell, one stylesheet, the first-paint script, the rest after first paint, data on demand ----
A=os.path.join(out,'assets');shutil.rmtree(A,ignore_errors=True);os.makedirs(os.path.join(A,'data'))
def put(name,data):
    with open(os.path.join(A,name),'wb') as f: f.write(data if isinstance(data,bytes) else data.encode('utf-8'))
    return 'assets/'+name
files={}
for n,b in DATA.items(): files[n]=put('data/'+n+'.'+H(b)+'.json',b)
first=[m for m in mods if m in FIRST];rest=[m for m in mods if m not in FIRST]
if rest:
    restjs=brandify(modjs(rest)+'\n;BUNDLE._done();\n');REST=put('rest.'+H(restjs)+'.js',restjs);C={'split':True,'files':files,'rest':REST};TAIL='\n;BUNDLE._first();\n'
else:
    restjs='';C={'split':True,'files':files};TAIL='\n;BUNDLE._done();\n'
appjs=brandify(BRANDJS+cfg(C)+RUNTIME+'\n'+CORE+'\n;BUNDLE._core();'+modjs(first)+'\n;BUNDLE._shell();\n'+S3+TAIL)
APP=put('app.'+H(appjs)+'.js',appjs)
stylecss=css_split(CSS)
STYLE=put('style.'+H(stylecss)+'.css',stylecss)
for name,src in cssfiles.items(): shutil.copyfile(src,os.path.join(A,name))
BOOTCSS='<style>:root{color-scheme:light}body{margin:0}#oukBoot{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#FBFBF9 url(hero/server-hall.webp?v=21b) center/cover;font:500 15px system-ui,sans-serif;color:#16262B}#oukBoot>div{background:rgba(255,255,255,.88);padding:22px 30px;border-radius:18px;text-align:center;box-shadow:0 10px 40px rgba(20,60,76,.18)}#oukBoot b{display:block;font:600 26px Georgia,serif;margin-bottom:6px}#oukBoot i{display:block;height:4px;width:180px;margin:12px auto 0;border-radius:2px;background:linear-gradient(90deg,#0C6074 30%,#cfe3e8 30%);background-size:200% 100%;animation:oukb 1.2s linear infinite}@keyframes oukb{to{background-position:-200% 0}}</style>'
open(os.path.join(out,'index.html'),'w',encoding='utf-8').write('<!doctype html><html lang="en"><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">'
  +f'<title>{NAME}</title><link rel="preload" as="style" href="{STYLE}"><link rel="preload" as="script" href="{APP}"><link rel="preload" as="image" href="hero/server-hall.webp?v=21b" fetchpriority="high">'+"".join(f'<link rel="preload" as="image" href="assets/{n}">' for n in sorted(cssfiles))  # CL-28: images the stylesheet uses arrive with it
  +BOOTCSS+FAV+fonts+'</head><body><div id="oukBoot" role="status" aria-live="polite"><div>'+BOOTLOGO+'<b>'+NAME+'</b>Loading your workspace<i></i></div></div>'
  +f'<link rel="stylesheet" href="{STYLE}"><script src="{APP}"></script></body></html>')
if os.path.isdir('assets/hero'): shutil.copytree('assets/hero',os.path.join(out,'hero'),dirs_exist_ok=True)
if os.path.isdir('assets/journey'): shutil.copytree('assets/journey',os.path.join(out,'journey'),dirs_exist_ok=True)
print(len(html),'bytes; split:',len(appjs),'first-paint js,',len(restjs),'rest js'+('' if rest else ' (one script)')+',',len(stylecss),'css; first-paint modules:',len(first),'of',len(mods),'; modules:',mods)
