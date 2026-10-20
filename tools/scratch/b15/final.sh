#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
export NODE_PATH=$(npm root -g)
MY=bud_over,bud_lines,bud_ccmap,bud_req,bud_ven
node b15/suite.js out_b15 --dark > b15/f_suite_d.log 2>&1
node b15/suite.js out_b15 --phone > b15/f_suite_lp.log 2>&1
node b15/clicks.js out_b15 > b15/f_clicks.log 2>&1
node spacescan.js out_b15 --w 1440 --only $MY > b15/f_space1440.log 2>&1
node spacescan.js out_b15 --w 1000 --only $MY > b15/f_space1000.log 2>&1
node spacescan.js out_b15 --phone --only $MY > b15/f_spacep.log 2>&1
node cardscan.js out_b15 --only $MY > b15/f_card.log 2>&1
node cardscan.js out_b15 --only $MY --theme dark > b15/f_cardd.log 2>&1
node allscreens.js out_b15 > b15/f_all.log 2>&1
node nestscan.js out_b15 --json b15/nest_final.json > b15/f_nest.log 2>&1
echo done > b15/f_done
