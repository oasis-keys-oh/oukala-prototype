#!/bin/bash
# build with all modules that pass node --check (other agents edit concurrently)
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
ok=""
for f in mod_*.js; do m=${f%.js}; if node --check $f 2>/dev/null; then ok="$ok,$m"; else echo "SKIP (syntax) $m"; fi; done
for f in mod_*.css; do m=${f%.css}; [ -f $m.js ] || ok="$ok,$m"; done
python3 build.py --only "${ok#,}" --out ${1:-out_d15} >/dev/null && node --check ${1:-out_d15}/oukala-js.js && echo built
