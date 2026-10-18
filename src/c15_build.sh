#!/bin/bash
# build my out dir, skipping any module whose JS fails node --check (other agents may be mid-edit)
cd "$(dirname "$0")"
mods=""
for f in mod_*.js; do m=${f%.js}; if node --check $f 2>/dev/null; then mods="$mods,$m"; else echo "SKIP (syntax) $m"; fi; done
for f in mod_*.css; do m=${f%.css}; [ -f $m.js ] || mods="$mods,$m"; done
python3 build.py --only "${mods#,}" --out out_c15 | cut -c1-40
node --check out_c15/oukala-js.js && echo SYNTAX_OK
