#!/bin/bash
# build to out_k16 skipping any other agent's module that currently fails node --check
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
ok=""; for f in mod_*.js; do if node --check "$f" 2>/dev/null; then ok="$ok,${f%.js}"; else echo "SKIP broken $f"; fi; done
for f in mod_*.css; do ok="$ok,${f%.css}"; done
python3 build.py --only "${ok:1}" --out ${K_OUT:-out_k16} | tail -c 60
