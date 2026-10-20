/* ===== mod_s_showroom_lens: one lens mechanism for the Showroom (backlog DC-05 shared lens, DC-07 COO lens, DC-28 the other seven).
   A lens is configuration, not code: which screens (beats, in order), which metrics (shown in the talk track) and which wording
   (the question, the balance and the spoken lines). It reuses the executive lenses of mod_r18e_lens (R18.LENSES): applying a lens
   sets that lens, the role it is told from, and a lens cut of the tour. Beats reuse existing tour beats by reference
   ("coo/set.1") or name an existing screen inline; no new screen is built. Prefix: srl-. ===== */
(function(){
const W=window;const SHOW=W.SHOW;if(!SHOW)return;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
G(()=>{if(W.R18&&R18.LENS_OF)R18.LENS_OF.clo="clo"}); /* the CLO role reads its own lens (DC-28) */

/* the lens beat every cut shares: the r18_lens screen with this lens selected */
const lensBeat=(id,short,line)=>({id:"lens."+id,act:"Lens",point:short+" lens: value, cost and risk on one page",secs:70,go:"r18_lens",setup:"lens:"+id,
 say:[line,"Every figure on it is modeled from the sample builds and labeled illustrative."],do:"Switch to another lens and back.",claims:["modeled"]});

/* ---------- the lenses (configuration) ----------
   id, short, name, r18 (lens id in R18.LENSES), persona (role key), q, metrics (METRICS ids), beats (refs or inline beats),
   say (beat id -> two sentences, overrides the reused beat's wording), tab (beat id -> tab, overrides) */
const LENSES=[
{id:"coo",short:"COO",name:"Chief Operating Officer",r18:"coo",persona:"coo",q:"Where does work stall, and what is ready to scale?",
 metrics:["m_delivery","m_ops","m_ontime"],
 beats:["coo/set.1",lensBeat("coo","COO","The COO lens weighs throughput against the cost to serve."),"coo/demand.1","coo/track.1","coo/deliver.1",
  {id:"coo.od",act:"Deliver",point:"Agent Action: the COO brief behind the build plan",secs:90,go:"orgdesign",tab:"COO brief",
   say:["Agent Action starts from the COO's brief and walks through sources, diagnosis, gaps and a roadmap.","The options are modeled from the sample organization, and none of the agents is running."],
   do:"Open Gaps and options.",claims:["modeled","simulated"]},
  "coo/deliver.4","coo/build.1"],
 say:{"set.1":["These are the objectives the COO is held to, each with an owner and a measure.","The alignment score is a sample value, so treat it as modeled."]}}];

/* ---------- mechanism ---------- */
const BYL={};LENSES.forEach(l=>BYL[l.id]=l);
const r18Lens=id=>G(()=>R18.LENSES.find(x=>x.id===id),null);
function lensOf(id){const l=BYL[id];if(!l)return null;const r=r18Lens(l.r18)||{};
 return Object.assign({},l,{q:l.q||r.q,balance:l.balance||r.balance,screens:cutOf(l).beats.map(b=>b.go)})}
/* apply: the lens on R18 (every lens strip and the Executive lenses screen), the role it is told from, remembered */
function applyLens(id,o){o=o||{};const l=BYL[id];if(!l)return false;
 if(!o.keepPersona&&l.persona&&G(()=>S.persona,null)!==l.persona&&!o.quiet)G(()=>NAVX.persona.set(l.persona));
 G(()=>{R18.st.lens=l.r18;R18.st.lensBy=S.persona});G(()=>U.store.set("showroom.lens",id));
 if(!o.quiet)G(()=>render());return true}
function refBeat(ref){const [d,b]=String(ref).split("/");const t=G(()=>SHOW.byId(d).beats.find(x=>x.id===b),null);return t?JSON.parse(JSON.stringify(t)):null}
function cutOf(l){const beats=l.beats.map(x=>typeof x==="string"?refBeat(x):JSON.parse(JSON.stringify(x))).filter(Boolean).map(b=>{
  if(l.say&&l.say[b.id])b.say=l.say[b.id].slice();if(l.tab&&l.tab[b.id])b.tab=l.tab[b.id];delete b.kids;return b});
 return{id:"lens-"+l.id,title:l.short+" lens",group:"lens",lens:l.id,persona:l.persona,tenant:"core",who:l.name,
  mins:Math.round(beats.reduce((a,b)=>a+b.secs,0)/60),
  blurb:"The same platform told for the "+l.name+": "+l.q+" Screens, metrics and wording come from the lens configuration; the data is the fictional Meridian sample.",beats}}
function register(){LENSES.forEach(l=>SHOW.add(cutOf(l)))}
register();
Object.assign(SHOW,{lenses:LENSES,lensOf,applyLens,lensCut:id=>SHOW.byId("lens-"+id)});

/* ---------- Showroom home: the lens list ---------- */
const chips=l=>(l.metrics||[]).map(id=>G(()=>{const m=METRICS[id];return m?`<span class="srl-m">${E(m.n)} <b>${E(mfmt(m))}</b></span>`:""},"")).join("");
SHOW.home.push(()=>`<section class="sr-card glass srl" aria-label="Executive lenses"><div class="sr-ch"><h3>Executive lenses</h3><span class="sr-pill">Configuration only</span></div>
 <p class="muted small">A lens picks the screens, the metrics and the wording for one executive. Starting a lens cut switches the role it is told from and the lens on every lens strip. Metric values are modeled sample values.</p>
 <div class="srl-grid">${LENSES.map(l=>{const d=SHOW.byId("lens-"+l.id);return `<article class="srl-c"><div class="srl-h"><b>${E(l.short)}</b><span class="muted small">${E(l.name)}</span></div>
  <p class="small">${E(l.q)}</p><div class="srl-ms">${chips(l)}</div><p class="muted small">${d.beats.length} beats, ${SHOW.fmt(d.total)}</p>
  <div class="row"><button type="button" class="btn primary sm" data-sr-start="lens-${E(l.id)}">Start the ${E(l.short)} cut</button><button type="button" class="btn quiet sm" data-srl-apply="${E(l.id)}">Apply lens only</button></div></article>`}).join("")}</div></section>`);
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-srl-apply]");if(!t)return;applyLens(t.dataset.srlApply);G(()=>toast(BYL[t.dataset.srlApply].short+" lens applied, viewing as "+G(()=>PERSONAS[S.persona].n,""),"info"))});
})();
