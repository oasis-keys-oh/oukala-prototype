/* ===== mod_s_showroom_tours: more Showroom tours over existing screens (backlog DC-15, DC-16, DC-21 children, DC-30).
   DC-15  VibeCheck Executive cut (8 to 10 minutes), opening with the "Build the fix in VibeCheck" hand-off (DC-17)
   DC-16  tenant VibeCheck briefs: Healthcare referral and prior authorization, Mining permit to work, Storage drive swap, Meridian
   DC-21  the six guardrail children attached to the COO cut as optional child beats, one per act, and as a cut of their own
   DC-30  the full-story path (COO cut, then the guardrails cut: two cuts, each under the 1,200 second limit) and a printable
          leave-behind built from the beats and their claim chips
   Every beat opens a screen that already exists. Fictional sample data only. Prefix: srt-. ===== */
(function(){
const W=window,D=document;const SHOW=W.SHOW;if(!SHOW)return;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---------- DC-17 beat support: the hand-off as a beat setup ---------- */
SHOW.setups.fix=()=>{const f=SHOW.lastFix&&SHOW.lastFix.t>SHOW.state.t0?SHOW.lastFix:null;
 const c=f||G(()=>SHOW.firstFixCard,null)||{kind:"build",ref:"",title:"the first build on the Build list"};
 G(()=>SHOW.buildFix({kind:c.kind,ref:c.ref,title:c.title}))};

/* ---------- DC-15: VibeCheck Executive cut ---------- */
SHOW.add({id:"vibe",title:"VibeCheck Executive cut",mins:10,who:"Executives who sponsor builders: CIO, COO, CAIO",persona:"exec",group:"main",
 blurb:"A gap on the Build list becomes a plain request; VibeCheck finds what exists, builds inside the guardrails, routes the approval and lands the build where IT and executives can see it. The interview is scripted.",
 beats:[
 {id:"v.1",act:"Gap",point:"A gap on the Build list becomes a plain request",secs:50,go:"ppl_jrny",tab:"Build list",
  say:["Every card on the Build list is a gap the journeys found, with the hours it would return.","The button on each card hands that gap to VibeCheck as a plain request."],
  do:"Point at Build the fix in VibeCheck on the first card.",claims:["modeled","hypothesis"]},
 {id:"v.2",act:"Ask",point:"The gap arrives in VibeCheck as a request",secs:60,go:"studio",setup:"fix",
  say:["VibeCheck reads the request, searches the library and starts the interview.","The interview is scripted in this prototype, so show it as a preview."],
  do:"Read the request it received.",claims:["simulated"]},
 {id:"v.3",act:"Find",point:"A worked example: it searches the library before building",secs:60,go:"studio",setup:"studio:scen:ret:find",
  say:["For damaged deliveries it finds a process that already exists and offers to extend it.","Reuse first is the rule, so nothing is built twice."],
  do:"Press Next in the click-through.",claims:["simulated","fact"]},
 {id:"v.4",act:"Process",point:"Every step is done by a human, robot or agent",secs:70,go:"studio",setup:"studio:scen:ret:flow",
  say:["The process takes shape as steps, each done by a person, a robot or an agent.","Click a step to change who does it; agents get a human sponsor."],
  do:"Click one step to change who does it.",claims:["simulated"]},
 {id:"v.5",act:"Data",point:"Data comes from its owners, not from copies",secs:50,go:"studio",setup:"studio:scen:ret:data",
  say:["It reads and writes the data model the enterprise already has, and asks the owners for anything new.","No connector is live in the prototype."],
  do:"Point at the reused data.",claims:["simulated"]},
 {id:"v.6",act:"Measure",point:"How you will know it works",secs:50,go:"studio",setup:"studio:scen:ret:metrics",
  say:["Each measure says what decision it supports and who owns it.","Targets are sample values until the team sets its own."],
  do:"Open one measure.",claims:["modeled"]},
 {id:"v.7",act:"Guardrails",point:"Guardrails come in the box, not afterwards",secs:60,go:"studio",setup:"studio:scen:ret:guard",
  say:["Access, continuity, testing and accessibility are added for you because the build needs them.","They are checked in the prototype; enforcement in a live system is a plan."],
  do:"Open the guardrails list.",claims:["simulated","fact"]},
 {id:"v.8",act:"Ship",point:"Approval routes to a group, then it ships",secs:50,go:"studio",setup:"studio:scen:ret:approve",
  say:["The approval path depends on risk: low-risk extensions need less, new data needs its owner.","Approvals always go to a group and the requester never approves their own."],
  do:"Point at who approves it.",claims:["simulated","fact"]},
 {id:"v.9",act:"Land",point:"Every build lands in one inventory IT can see",secs:60,go:"r18_builds",
  say:["Each build shows its owner, its guardrails and what still needs action.","Nothing is shadow IT because nothing is built outside this inventory."],
  do:"Open Need action.",claims:["fact","modeled"]},
 {id:"v.10",act:"Oversee",point:"Executives see value, cost and risk of every build",secs:60,go:"r18_lens",
  say:["The lens rolls every build into value, cost and risk for one executive.","The dollar figures are modeled from an editable rate and are illustrative."],
  do:"Switch between the CIO and COO lenses.",claims:["modeled"]}]});

})();
