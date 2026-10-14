#!/bin/bash
cd "$(dirname "$0")"
L=$(ls mod_*.js mod_*.css | sed 's/\.[a-z]*$//' | sort -u | grep -v -E '^mod_r17(o1|n)' | paste -sd,)
python3 build.py --only "$L" --out out_o217 | cut -c1-80
node --check out_o217/oukala-js.js && echo jsok
