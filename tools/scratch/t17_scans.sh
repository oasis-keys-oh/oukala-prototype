#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2
export NODE_PATH=$(npm root -g)
node spacescan.js out_t17 --only org_chart,ppl_org > t17_sp1.log 2>&1
node spacescan.js out_t17 --dark --only org_chart,ppl_org > t17_sp2.log 2>&1
node spacescan.js out_t17 --phone --only org_chart,ppl_org > t17_sp3.log 2>&1
node cardscan.js out_t17 --only org_chart,ppl_org > t17_card.log 2>&1
node perm_test.js out_t17 --quiet > t17_perm.log 2>&1
node allscreens.js out_t17 > t17_all.log 2>&1
echo done > t17_scans.done
