#!/bin/sh
# PR-31: second approve probe round
cd "$(dirname "$0")"
export NODE_PATH="$(cd ../../../../../.. && pwd)/node_modules"
run(){ echo "### $*"; node approve.js "$@" 2>&1 | grep -v '^errors \[\]' | grep -v '^ *at \|Call log\|waiting\|retrying\|element is\|attempting\|^ *-\|^ *[0-9]* ×' | cut -c1-600; }
run proc itsm_chg "CAB and approvals"
run proc itsm_chg "CAB and approvals" mining
run fin flw_appr
run pm flw_appr
run ops flw_appr
run portfolio port "Review board"
