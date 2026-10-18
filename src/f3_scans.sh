#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
export NODE_PATH=$(npm root -g)
ONLY=r15_time,r15_p2p,r15_iam,r15_sem,r15_rpt,r15_mobile
node spacescan.js out_f3_15 --dark --only $ONLY > f3_sp1.log 2>&1
node spacescan.js out_f3_15 --phone --only $ONLY > f3_sp2.log 2>&1
node cardscan.js out_f3_15 --only $ONLY > f3_cs.log 2>&1
node f3_hash.js > f3_hash.log 2>&1
echo done > f3_scans.done
