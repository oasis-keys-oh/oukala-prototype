cd "$(dirname "$0")" && python3 mk_viz.py && node --check mod_viz.js && node --check mod_viz2.js && python3 build.py --only viz,viz2 --out out_viz | tail -1
