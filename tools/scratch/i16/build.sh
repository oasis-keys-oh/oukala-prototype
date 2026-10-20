#!/bin/bash
# build all modules whose JS passes node --check (other agents edit concurrently)
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
list=""
for f in mod_*.js mod_*.css; do b=${f%.*}; case ",$list," in *",$b,"*) continue;; esac
 if [ -f "$b.js" ]; then node --check "$b.js" 2>/dev/null || { echo "SKIP $b (syntax)"; continue; }; fi
 list="$list,$b"; done
python3 build.py --only "${list#,}" --out ${1:-out_i16} | cut -c1-40
node --check ${1:-out_i16}/oukala-js.js && echo built-ok
