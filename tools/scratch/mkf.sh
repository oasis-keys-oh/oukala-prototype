#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
L=$(ls mod_*.js mod_*.css | sed 's/\.[a-z]*$//' | sort -u | grep -v "mod_zlink\|mod_zsearch\|mod_flow_ins" | paste -sd,)
python3 build.py --only "$L" --out ${1:-out_f14} | cut -c1-14
