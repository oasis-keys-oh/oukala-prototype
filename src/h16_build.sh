#!/bin/bash
# build with baseline + only r16h modules (isolates from other agents' in-progress files)
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
L=$(ls mod_*.js mod_*.css | sed 's/\..*//' | sort -u | grep -v '^mod_r16[a-gi-z]' | tr '\n' ',' | sed 's/,$//')
python3 build.py --only "$L" --out ${1:-out_h16} | tail -c 100
