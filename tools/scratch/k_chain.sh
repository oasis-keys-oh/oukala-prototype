#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
export NODE_PATH=$(npm root -g)
timeout 1500 node k_final2.js out_k16b > /tmp/k_final2.txt 2>&1
timeout 1200 node spacescan.js out_k16b --phone --only strat_exec,dec_cov,rec_shell,r15d_evidence,home > /tmp/k_spph3.txt 2>&1
timeout 900 node cardscan.js out_k16b --only itom_model,r15d_firstweek,kcs_viz,strat_exec > /tmp/k_card3.txt 2>&1
timeout 2400 node allscreens.js out_k16b > /tmp/k_all2.txt 2>&1
timeout 2400 node k_tap.js out_k16b > /tmp/k_tap4.txt 2>&1
