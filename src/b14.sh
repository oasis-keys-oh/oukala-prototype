#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
L=$(ls mod_*.js mod_*.css | sed 's/\.\(js\|css\)$//' | sort -u | grep -v "${EXCL:-NOPE_X}" | paste -sd,)
python3 build.py --only $L --out out_d14 | tail -c 60
