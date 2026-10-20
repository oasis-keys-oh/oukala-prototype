#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
ONLY=""
for f in mod_*.js; do case "$f" in mod_r16[a-ik-z]*) echo "skip other-agent $f"; continue;; esac
  if node --check "$f" >/dev/null 2>&1; then ONLY="$ONLY,${f%.js}"; else echo "SKIP broken $f"; fi
done
for f in mod_*.css; do b=${f%.css}; [[ ",$ONLY," == *",$b,"* ]] || ONLY="$ONLY,$b"; done
python3 build.py --only "${ONLY#,}" --out out_j16 | tail -c 60
