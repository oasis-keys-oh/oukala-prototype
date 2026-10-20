// Shared helpers for the build lint (CL-46, CL-60) and the contract facts generator (CL-59).
// Reads src/ only: the core files and modules that build.py concatenates, never the quarantined " 2" copies (CL-07).
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');const SRC=path.join(ROOT,'src');

/* The source files the build reads: every src/*.js and src/*.css except the quarantine copies. Generated data files are
   marked so rules about hand-written view code can skip them. */
function sources(){
 const out=[];
 for(const f of fs.readdirSync(SRC).sort()){
  if(/ 2\./.test(f)||!/\.(js|css)$/.test(f))continue;
  const t=fs.readFileSync(path.join(SRC,f),'utf8');
  out.push({f,ext:f.endsWith('.css')?'css':'js',t,generated:/^\/\*\s*GENERATED\b/.test(t.slice(0,300)),module:/^mod_/.test(f),core:!/^mod_/.test(f)});
 }
 return out;
}
const lineAt=(t,i)=>{let n=1;for(let k=0;k<i&&k<t.length;k++)if(t.charCodeAt(k)===10)n++;return n};
/* Fast line index for many lookups in one file */
function lineIndex(t){const L=[0];for(let i=0;i<t.length;i++)if(t.charCodeAt(i)===10)L.push(i+1);return i=>{let lo=0,hi=L.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(L[m]<=i)lo=m;else hi=m-1}return lo+1}}

/* A small JavaScript lexer. Returns
   strings: [{v, i, t}] string literal and template text contents (raw, escapes kept), with the start offset; t is "q" or "t"
   code:    the source with comments, string contents and template text blanked to spaces (offsets unchanged); template
            expressions ${...} stay as code
   nc:      the source with only comments blanked (strings intact)
   Regex literals are recognized by the previous significant character, which is right for the code in this repository. */
const KW=new Set(['return','typeof','case','do','else','in','of','new','delete','void','throw','yield','await','instanceof']);
function lex(src){
 const n=src.length,code=src.split(''),nc=src.split(''),strings=[];
 const blank=(a,s,e)=>{for(let k=s;k<e;k++)if(a[k]!=='\n')a[k]=' '};
 let i=0;const stack=[];// template brace depths
 let prev='';// previous significant char or word
 const regexOk=()=>{if(!prev)return true;if(KW.has(prev))return true;return /^[(,=:\[!&|?{};+\-*%<>~^]$/.test(prev)||prev==='}'||prev==='=>'};
 function readTemplate(){// i points at the backtick or at the "}" that closes an expression
  let segStart=i+1;i++;
  while(i<n){const c=src[i];
   if(c==='\\'){i+=2;continue}
   if(c==='`'){strings.push({v:src.slice(segStart,i),i:segStart,t:'t'});blank(code,segStart,i);i++;return 'end'}
   if(c==='$'&&src[i+1]==='{'){strings.push({v:src.slice(segStart,i),i:segStart,t:'t'});blank(code,segStart,i);i+=2;stack.push(0);return 'expr'}
   i++}
  return 'end'}
 while(i<n){
  const c=src[i],d=src[i+1];
  if(c==='/'&&d==='/'){const s=i;while(i<n&&src[i]!=='\n')i++;blank(code,s,i);blank(nc,s,i);continue}
  if(c==='/'&&d==='*'){const s=i;const e=src.indexOf('*/',i+2);i=e<0?n:e+2;blank(code,s,i);blank(nc,s,i);continue}
  if(c==='"'||c==="'"){const s=i+1;i++;while(i<n&&src[i]!==c&&src[i]!=='\n'){if(src[i]==='\\')i++;i++}
   strings.push({v:src.slice(s,i),i:s,t:'q'});blank(code,s,i);i++;prev='"';continue}
  if(c==='`'){prev=readTemplate()==='expr'?'{':'"';continue}
  if(c==='}'&&stack.length&&stack[stack.length-1]===0){stack.pop();prev=readTemplate()==='expr'?'{':'"';continue}
  if(c==='{'){if(stack.length)stack[stack.length-1]++;prev='{';i++;continue}
  if(c==='}'){if(stack.length)stack[stack.length-1]--;prev='}';i++;continue}
  if(c==='/'&&regexOk()){// regex literal
   const s=i;i++;let cls=false;while(i<n&&src[i]!=='\n'){const ch=src[i];if(ch==='\\'){i+=2;continue}if(ch==='[')cls=true;else if(ch===']')cls=false;else if(ch==='/'&&!cls)break;i++}
   i++;while(i<n&&/[a-z]/i.test(src[i]))i++;blank(code,s+1,i-1);prev='r';continue}
  if(/\s/.test(c)){i++;continue}
  if(/[A-Za-z_$]/.test(c)){const s=i;while(i<n&&/[\w$]/.test(src[i]))i++;prev=src.slice(s,i);if(!KW.has(prev))prev='a';continue}
  if(/[0-9]/.test(c)){while(i<n&&/[\w.]/.test(src[i]))i++;prev='a';continue}
  if(c==='='&&d==='>'){prev='=>';i+=2;continue}
  if(c===')'||c===']'){prev='a';i++;continue}
  prev=c;i++}
 return{strings,code:code.join(''),nc:nc.join('')};
}
const stripCssComments=t=>t.replace(/\/\*[\s\S]*?\*\//g,m=>m.replace(/[^\n]/g,' '));
module.exports={ROOT,SRC,sources,lex,lineAt,lineIndex,stripCssComments};
