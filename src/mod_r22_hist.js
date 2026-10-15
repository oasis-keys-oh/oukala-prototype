/* Round 22: Back and Forward understand windows. Opening a record drawer, a metric window or a chooser adds one history step;
   Back closes it, and closing it any other way takes the step away again. Entries left behind by a navigation are skipped. */
(function(){
const W=window,D=document;
let seq=(history.state&&history.state.i)||0,last=seq,tokN=0;const open=[];
try{
 const ps=history.pushState.bind(history),rs=history.replaceState.bind(history);
 history.pushState=function(st,t,u){st=Object.assign({},st||{},{i:++seq});return ps(st,t,u)};
 history.replaceState=function(st,t,u){const cur=history.state||{};st=Object.assign({},st||{},{i:cur.i||seq});if(cur.ovl&&!(st&&st.ovl))st.ovl=cur.ovl;return rs(st,t,u)};
}catch(e){}
const MODAL='#drawer,#inbxFocus,.pop:not(#profilePop):not(#r15dVas):not(#r18LensPop):not(#r16WhyPop):not(#inbxPanel):not(.nx-pop):not(.nw-pop):not(.anch):not(.r18-lenspop)';
D.addEventListener("toggle",e=>{const el=e.target;if(!el||!el.matches||!el.matches(MODAL))return;
 if(e.newState==="open"){if(open.some(o=>o.el===el))return;const tok="o"+(++tokN);open.push({el,tok});try{history.pushState({ovl:tok},"",location.href)}catch(x){}return}
 const k=open.findIndex(o=>o.el===el);if(k<0)return;const o=open.splice(k,1)[0];if(o.byBack)return;
 setTimeout(()=>{try{if(history.state&&history.state.ovl===o.tok)history.back()}catch(x){}},0)},true);
W.addEventListener("popstate",()=>{const s=history.state||{},i=s.i||0,dir=i<last?-1:1;last=i;
 if(s.ovl){if(open.some(o=>o.tok===s.ovl))return;try{dir<0?history.back():history.forward()}catch(x){}return}
 if(open.length){const o=open.pop();o.byBack=true;try{o.el.hidePopover()}catch(x){}}});
})();
