module.exports=[
['persona',k=>{NAVX.persona.set(k);return S.persona},'ops'],
['can inv',()=>PERM.can(null,'read','screen:inv').ok],
['go inv',()=>{go('inv');return {den:!!document.querySelector('#view [data-perm-denied]'),len:document.getElementById('view').innerHTML.length}}],
['nav',()=>({inv:!!document.querySelector('#nav [data-nx-it="inv"]'),items:document.querySelectorAll('#nav [data-nx-it]').length})],
['p360',()=>{person360('Priya Shah');return [...document.querySelectorAll('#drawer .views[data-views="p360"] .vsw label')].map(x=>x.textContent.trim())}],
['close',()=>{closeDrawer();return 1}],
['bud',()=>{const rs=BUDREQ.requests();return rs.slice(0,3).map(r=>r.id+":"+r.st)}],
['go bud_req',()=>{go('bud_req');return {den:!!document.querySelector('#view [data-perm-denied]')}}],
['persona fin',k=>{NAVX.persona.set(k);go('bud_req');BUDREQ.openReq(BUDREQ.requests().find(r=>r.st==='dec').id);return document.querySelectorAll('#drawer [data-br-act]').length},'fin'],
['fin approve click',()=>{const b=document.querySelector('#drawer [data-br-act$=":Approve"]');b.click();return !!document.querySelector('#drawer [data-form="budreq_dec"]')}],
['persona ops2',k=>{NAVX.persona.set(k);go('bud_req');return 1},'ops'],
['org',()=>{go('org_chart');return document.querySelectorAll('.org-card').length}],
['search',()=>searchIndex().filter(r=>r.g==='Invoices').length]
];
