module.exports=[
['portfolio',k=>{NAVX.persona.set(k);go('home');return S.persona},'portfolio'],
['p360',()=>{person360('Priya Shah');return [...document.querySelectorAll('#drawer .views[data-views="p360"] .vsw label')].map(x=>x.textContent.trim())}],
['close',()=>{closeDrawer();return 1}],
['org',async()=>{(window.ORGX&&ORGX.openProfile||O.openProfile)('Priya Shah');await new Promise(r=>setTimeout(r,200));const d=document.getElementById('drawer');return{tabs:[...d.querySelectorAll('.views[data-views="org_p"] .vsw label')].map(x=>x.textContent.trim()),h4:[...d.querySelectorAll('h4.org5-h')].map(x=>x.textContent),panes:[...d.querySelectorAll('.views[data-views="org_p"] .pane')].length}}],
['org again',async()=>{const d=document.getElementById('drawer');await new Promise(r=>setTimeout(r,500));return{h4:[...d.querySelectorAll('h4.org5-h')].map(x=>x.textContent),txt:/Base salary/.test(d.innerText)}}]
];
