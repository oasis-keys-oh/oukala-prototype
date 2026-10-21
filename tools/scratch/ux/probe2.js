// PR-31 probe 2: fresh-load keyboard order, toast lifetime, counts, board read-only actions, chat answers, header contrast.
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const ROOT=path.resolve(__dirname,'../../..');const out=path.join(__dirname,'shots','_probe2');fs.mkdirSync(out,{recursive:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+ROOT+'/build_out/full.html',{waitUntil:'domcontentloaded',timeout:180000});
await p.waitForFunction(()=>window.NAVX&&typeof go==='function'&&window.EXP,null,{timeout:180000});await p.waitForTimeout(800);
const R={};
/* toast lifetime */
R.toast=[];for(let i=0;i<8;i++){R.toast.push(await p.evaluate(()=>[...document.querySelectorAll('[class*=toast],[class*=banner],#inbxBanners > *')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.className.slice(0,40)+': '+e.innerText.replace(/\s+/g,' ').slice(0,80))));await wait(2500)}
await p.screenshot({path:out+'/after20s.jpg',type:'jpeg',quality:55});
/* fresh keyboard order */
await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.NAVX&&typeof go==='function',null,{timeout:180000});await p.waitForTimeout(1500);
R.kbd=[];for(let i=0;i<30;i++){await p.keyboard.press('Tab');R.kbd.push(await p.evaluate(()=>{const e=document.activeElement;if(!e||e===document.body)return 'body';const cs=getComputedStyle(e);
 return e.tagName+' ['+(e.closest('#nav')?'rail':e.closest('#view')?'view':e.closest('header,.top,#top,[class*=topbar]')?'top':'other')+'] '+(e.getAttribute('aria-label')||e.textContent||'').trim().replace(/\s+/g,' ').slice(0,40)+(cs.outlineStyle!=='none'||cs.boxShadow!=='none'?'':' NO-RING')}))}
await p.screenshot({path:out+'/kbd_fresh.jpg',type:'jpeg',quality:55});
/* counts: my work badge, approvals, bell */
R.counts=await p.evaluate(()=>({nav:[...document.querySelectorAll('#nav [data-nav], #nav button')].map(e=>e.innerText.replace(/\s+/g,' ').trim()).filter(t=>/\d/.test(t)).slice(0,12),
 inbox:(window.INBOX&&INBOX.list)?INBOX.list().length:null}));
/* header colour */
R.th=await p.evaluate(()=>{go('bst');const th=document.querySelector('#view th');if(!th)return null;const cs=getComputedStyle(th);return {color:cs.color,bg:cs.backgroundColor,fs:cs.fontSize,tt:cs.textTransform,pbg:getComputedStyle(th.parentElement).backgroundColor,tbg:getComputedStyle(th.closest('table')).backgroundColor}});
/* tower Live chip */
R.live=await p.evaluate(()=>{go('tower');const t=document.getElementById('view').innerText;return (t.match(/.{0,40}Live.{0,80}/)||[''])[0]});
/* board read only: actions offered */
await p.evaluate(()=>NAVX.persona.set('board'));await wait(400);
R.board={};for(const id of ['home','exe_board','r15d_evidence','exe_risk','exe_dash','tower']){R.board[id]=await p.evaluate(async id=>{go(id);await new Promise(r=>setTimeout(r,300));
 const v=document.getElementById('view');const acts=[...v.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0&&!b.disabled).map(b=>b.textContent.trim()).filter(t=>/^(Approve|Reject|Generate|Edit|Request|Add|New|Create|Delete|Pause|Kill|Stop|Assign|Submit|Release|Hold|Accept|Escalate|Run|Start|Save|Publish)/i.test(t));
 return {acts:[...new Set(acts)].slice(0,15),dis:[...v.querySelectorAll('button[disabled],[aria-disabled=true]')].length,ro:(v.innerText.match(/read only|read-only/gi)||[]).length}},id);await p.screenshot({path:out+'/board_'+id+'.jpg',type:'jpeg',quality:55})}
R.boardCard=await p.evaluate(()=>{go('home');const c=document.querySelector('#view [data-ctb-card]');return c?c.innerText.replace(/\s+/g,' ').slice(0,300):null});
/* chat: the persona's own suggested questions */
R.chat={};for(const [k,qs] of [['caio',null],['ceo',null],['cco',null],['exec',null]]){
 R.chat[k]=await p.evaluate(async k=>{NAVX.persona.set(k);await new Promise(r=>setTimeout(r,300));const sg=(PERSONAS[k].sugg||[]).slice(0,3);const res=[];
  for(const q of sg){let a=null;try{if(window.ASKX&&ASKX.answer)a=ASKX.answer(q);else if(window.CHX&&CHX.ask)a=CHX.ask(q);else if(window.ask)a=ask(q)}catch(e){a='ERR '+e.message}
   res.push({q,a:a==null?null:(typeof a==='string'?a:JSON.stringify(a)).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,260)})}return {sugg:sg,res,apis:Object.keys(window).filter(x=>/^(ASK|CHX|CHAT)/.test(x))}},k)}
fs.writeFileSync(out+'/data.json',JSON.stringify(R,null,1));console.log(JSON.stringify(R,null,1).slice(0,9000));await b.close()})();
