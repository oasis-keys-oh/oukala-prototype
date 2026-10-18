#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
L=$(ls mod_*.js mod_*.css | sed 's/\.\(js\|css\)$//' | sort -u | grep -v '^mod_r16' ; echo mod_r16g_a_perm mod_r16g_b_enforce mod_r16g_c_admin mod_r16g_perm)
python3 build.py --only "$(echo $L | tr ' ' ',')" --out out_g16 | tail -c 40
