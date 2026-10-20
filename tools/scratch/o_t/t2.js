(async()=>{const o={};
S.org.tab='studio';go('org_chart');await new Promise(r=>setTimeout(r,500));
const n0=ORGX.agents().length;
document.querySelector('[data-org-build]').click();
o.after=ORGX.agents().length-n0;o.towerHas=S.agents.some(a=>a.orgBuilt);
const a=ORGX.agents().slice(-1)[0];o.agent=a.name+"|"+a.autonomy+"|"+a.hrs;
go('tower');await new Promise(r=>setTimeout(r,400));o.tower=document.querySelector('#view').innerText.includes(a.name);
for(const t of ['report','dir','own','chart']){S.org.tab=t;go('org_chart');render();await new Promise(r=>setTimeout(r,300));}
S.org.mode='ai';S.org.tab='chart';S.org.k=0;render();await new Promise(r=>setTimeout(r,300));o.aiCards=document.querySelectorAll('.org-n').length;
S.org.mode='both';render();o.bothCards=document.querySelectorAll('.org-n').length;
o.ev=CONTRACT.evaluate('org_chart').score;
ASKX.forEach(f=>{});
return o})()
