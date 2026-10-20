#!/bin/bash
# Generator (see tools/README.md). Writes mod_chat.js in src/ from tools/generators/chatparts/.
# SRC can point at a copy of src/ to compare without overwriting, for example: SRC=/tmp/srccopy bash mk_chat.sh
set -e
G="$(cd "$(dirname "$0")" && pwd)"; SRC="${SRC:-$G/../../src}"
cd "$G"
P=""; for f in p1 p2 p3 p4 p5 p6 p8 p7; do [ -f chatparts/$f.js ] && P="$P chatparts/$f.js"; done
( cat $P; echo; echo "})();" ) > "$SRC/mod_chat.js"
node --check "$SRC/mod_chat.js" && echo CHAT_JS_OK
