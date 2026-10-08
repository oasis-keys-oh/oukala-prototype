const wkday=s=>{const d=dow(s);return d!==0&&d!==6};
function suggestDay(c){const len=dif(c.end,c.start);for(let n=1;n<80;n++){const s=addD(c.start,n);if(s<=TODAYI||!wkday(s))continue;const t={...c,start:s,end:addD(s,len)};if(!collisions(t).filter(x=>x.kind==="hard").length&&!freezeHits(t).length)return s}return null}
function allCollisions(){const seen=new Set(),out=[];X.chg.filter(openCh).forEach(c=>collisions(c).forEach(x=>{const k=[c.id,x.o.id].sort().join("|");if(seen.has(k))return;seen.add(k);out.push({a:c,b:x.o,kind:x.kind,sh:x.sh})}));return out}
function freezeConflicts(){return X.chg.filter(c=>openCh(c)&&freezeHits(c).length).map(c=>({c,f:freezeHits(c)}))}
