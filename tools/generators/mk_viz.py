"""Generator: writes src/mod_viz.js and src/mod_viz2.js from tools/generators/vizsrc/. Needs esbuild (npm i -D esbuild, or ESBUILD=path).
Run: bash tools/generators/mk_viz.sh   (SRC=<folder> writes into a copy of src/ instead)."""
import subprocess,json,os,tempfile
G=os.path.dirname(os.path.abspath(__file__));os.chdir(G)
SRC=os.environ.get('SRC') or os.path.join(G,'..','..','src')
E_=os.environ.get('ESBUILD') or os.path.join(G,'..','..','node_modules','.bin','esbuild')
TMP=tempfile.gettempdir()
rd=lambda n:open('vizsrc/'+n+'.js',encoding='utf-8').read()
A=''.join(rd(n)+'\n' for n in 'p1 p2 p3 p4 p5 p6 p7 p8 p9a p9b'.split())
B=''.join(rd(n)+'\n' for n in 'p10 p11 p12 p13'.split())
B=B.rstrip()
assert B.endswith('})();');B=B[:-5]
A+='window.__vzx=function(c){return eval(c)};\n})();\n'
def mini(src,tag):
    open(os.path.join(TMP,'vz_'+tag+'.js'),'w',encoding='utf-8').write(src)
    r=subprocess.run([E_,os.path.join(TMP,'vz_'+tag+'.js'),'--minify-whitespace','--minify-syntax','--charset=utf8','--target=es2020','--legal-comments=none'],capture_output=True,text=True)
    if r.returncode:print(r.stderr);raise SystemExit(1)
    return r.stdout
a=mini(A,'a');b=mini('(function(){'+B+'})',"b")
b=b.strip().rstrip(';')
# eval the function expression string inside the viz scope: run body directly
bb=mini(B,'b2')
open(os.path.join(SRC,'mod_viz.js'),'w',encoding='utf-8').write(a)
open(os.path.join(SRC,'mod_viz2.js'),'w',encoding='utf-8').write('window.__vzx&&window.__vzx('+json.dumps(bb,ensure_ascii=False)+');delete window.__vzx;\n')
print(len(a.encode()),len(open(os.path.join(SRC,'mod_viz2.js'),encoding='utf-8').read().encode()))
