cd "$(dirname "$0")"
ids=org_chart,itsm_rel,tbm_model,exe_mat,bc_home,itsm_inc,strat_exec,fin_spend,r16g_perm,itom_cmdb,ppl_org,plat_contract
node r17_shot.js out_o217_base o2b $ids --h 1800
node r17_shot.js out_o217 o2a $ids --h 1800
echo done > r17o2_shots.done
