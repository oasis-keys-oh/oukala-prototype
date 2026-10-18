/* Round 23: validation-audit decisions. One owner and one name per concept; no process without an owner, a backup and a metric.
   Process fixes go through OWNFIX, read by mod_plat_proclib (ownerInfo, metricsOf, finish). */
(function(){
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const B=(owner,backup,extra)=>Object.assign({owner,backup},extra||{});
const SW=" (screen workflow)";
window.OWNFIX={
 /* owners that were role titles */
 decision_rules:B("Rina Okafor","Casey Rowan"),"nav.find":B("Sam Patel","Jordan Lee"),"nav.return":B("Sam Patel","Jordan Lee"),store_process:B("Anil Mehta","Jordan Lee"),
 /* backups that were missing */
 dec_cov:B(null,"Casey Rowan"),"meet.schedule":B(null,"Priya Shah"),"meet.run":B(null,"Priya Shah"),"meet.minutes":B(null,"Priya Shah"),"meet.actions":B(null,"Priya Shah"),"meet.decision":B(null,"Priya Shah"),
 feature_contract:B(null,"Casey Rowan"),"fin.budget_cycle":B(null,"Beatrice Nolan"),"fin.quarterly_reforecast":B(null,"Beatrice Nolan"),"fin.color_assignment":B(null,"Marcus Reid"),"fin.gl_reconciliation":B(null,"Beatrice Nolan"),"fin.release_event":B(null,"Beatrice Nolan"),"fin.variance_review":B(null,"Beatrice Nolan"),
 r15d_agents:B(null,"Kenji Watanabe"),r16h_status:B(null,"Casey Rowan"),r16h_ci:B(null,"Casey Rowan"),og_p_fac:B(null,"Tom Becker"),og_p_ev:B(null,"Tom Becker"),
 inbox_decide:B(null,"Rina Okafor"),draw_process:B(null,"Jordan Lee"),wf_run_process:B(null,"Sam Patel"),agent_run_process:B(null,"Kenji Watanabe"),
 /* processes without a metric */
 itom_graph:{metrics:["m_cmdbhealth"]},obs_dash:{metrics:["m_dash_bound"]},obs_std:{metrics:["m_itsm_cfr"]},bud_model:{metrics:["m_budvar"]},bud_doa:{metrics:["m_spend_unowned"]},adm_sec:{metrics:["m_access"]},adm_audit:{metrics:["m_ctrl"]},fin_spend:{metrics:["m_spend_var"]},fin_alloc:{metrics:["m_tbm_alloc"]},ppl_org:{metrics:["m_pp_over"]},r18_lens:{metrics:["m_decage"]},r18_levels:{metrics:["m_decage"]},r18_levels_view:{metrics:["m_decage"]},
 /* two definitions of the same process: one owner, and the older per-screen one is labelled */
 fin_p_budget:{owner:"Avery Chen",backup:"Beatrice Nolan",name:"Annual budget cycle"+SW},fin_p_reforecast:{owner:"Avery Chen",backup:"Beatrice Nolan",name:"Quarterly reforecast"+SW},fin_p_color:{owner:"Casey Rowan",backup:"Marcus Reid",name:"Color assignment at G1"+SW},fin_p_recon:{owner:"Avery Chen",backup:"Beatrice Nolan",name:"Monthly GL reconciliation"+SW},fin_p_release:{owner:"Avery Chen",backup:"Beatrice Nolan",name:"Release event"+SW},fin_p_variance:{owner:"Avery Chen",backup:"Beatrice Nolan",name:"Variance review"+SW},
 r15_p2p:{owner:"Avery Chen",backup:"Beatrice Nolan",name:"Procure to pay"+SW},bud_ccmap:{owner:"Victor Amaya",backup:"Avery Chen",name:"Change a cost center"+SW},cost_center_change:{owner:"Victor Amaya",backup:"Avery Chen"},bud_lines:{owner:"Victor Amaya",backup:"Avery Chen",name:"Review the full budget line by line"+SW},budget_line_review:{owner:"Victor Amaya",backup:"Avery Chen"},
 bud_ben:{name:"Benefits realization"+SW},svc_guides:{name:"Order guide: place, branch, fan out, track, close"+SW},plat_contract:{name:"Feature contract"+SW},r16m_import:{name:"Import foundation data"+SW}
};
window.OWNFIX_ROLES={"PMO director":"Maya Ortiz","Finance controller":"Avery Chen","CFO office":"Marcus Reid","Procurement lead":"Camille Ortega","AI platform lead":"Kenji Watanabe","AI governance lead":"Kenji Watanabe","Security lead":"Rina Okafor","Compliance lead":"Theo Marlowe","Process governance lead":"Rina Okafor","Platform owner":"Sam Patel","Data architect":"Anil Mehta"};
window.OWNFIX_BK={strat:["Priya Shah"],demand:["Priya Shah"],proj:["Dev Rao"],agile:["Jordan Lee"],chg:["Sam Patel"],inc:["Sam Patel"],req:["Nia Brooks"],cmdb:["Jordan Lee"],evt:["Tom Becker"],obs:["Jordan Lee"],fin:["Beatrice Nolan"],con:["Beatrice Nolan"],ppl:["Joanna Pierce"],kn:["Anil Mehta"],ai:["Kenji Watanabe"],wf:["Sam Patel"],gov:["Casey Rowan"],_:["Casey Rowan","Jordan Lee","Sam Patel"]};
/* one name per concept: say what each number measures */
const REN={m_pf_xla:["Experience score per person, 1 to 5"],m_xla_score:["Experience score, service desk"],m_svc_xla:["Experience score by service"],m_jr_xla:["Journey experience score"],
 m_rel_cfr:["Change failure rate (release trains)"],m_svc_mttr:["Time to restore (by service)"],m_slaatt:["SLA attainment (agreements)"],m_burn:["Forecast as share of approved budget"],
 m_val_zlink:["Connectivity score (value board)"],m_zl_score:["Connectivity score (live audit)"],m_val_contract:["Features with the full Feature Contract (value board)"],m_autorate:["Automation rate (platform)"],m_pf_idx:["People performance index"],m_pf_revdone:["People review completion"],m_p2p_match3:["Three-way match, first pass"]};
Object.keys(REN).forEach(k=>{const m=G(()=>METRICS[k]);if(m)m.n=REN[k][0]});
G(()=>{METRICS.m_pf_xla.u="/5"});
/* the live connectivity score is only computed when its screen opens: compute once so the value board and heroes agree with it */
setTimeout(()=>{G(()=>{ZLINK.audit();const live=METRICS.m_zl_score.cur;if(METRICS.m_val_zlink&&live>0)METRICS.m_val_zlink.cur=live})},1500);
/* screens with near-identical titles */
const TT={bud_model:"Budget model and forecast",ppl_org:"Workload by team",obs_dash:"Observability dashboards",r16j_dash:"Dashboard builder"};
G(()=>Object.keys(TT).forEach(id=>{const s=SCREENS.find(x=>x[0]===id);if(s)s[1]=TT[id]}));
G(()=>PROCLIB.refresh());
})();
