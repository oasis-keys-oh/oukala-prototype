#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
ok=""
for f in mod_*.js; do b=${f%.js}; if node --check $f >/dev/null 2>&1; then ok="$ok,$b"; else echo "SKIP broken $f"; fi; done
for f in mod_*.css; do b=${f%.css}; [ -f $b.js ] || ok="$ok,$b"; done
python3 build.py --only "${ok#,}" --out out_b15 | cut -c1-60
