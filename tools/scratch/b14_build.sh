#!/bin/sh
cd "$(dirname "$0")"
EX=${EX:-mod_zlink}
ALL=$(ls mod_*.js mod_*.css | sed 's/\.\(js\|css\)$//' | sort -u | grep -v "^$EX\$" | tr '\n' ',')
python3 build.py --only "$ALL" --out out_b14 | cut -c1-30
