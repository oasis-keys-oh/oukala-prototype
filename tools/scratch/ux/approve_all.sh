#!/bin/sh
# PR-31: run the approve probe for the approval-heavy personas
cd "$(dirname "$0")"
export NODE_PATH="$(cd ../../../../../.. && pwd)/node_modules"
run(){ echo "### $*"; node approve.js "$@" 2>&1 | grep -v '^errors \[\]' | cut -c1-700; }
run fin inv
run fin bud_req
run scm r15_p2p
run audit r15d_evidence
run fin inv "" health
run change itsm_chg "CAB and approvals" storage
run portfolio port "Pipeline"
run fin flw_appr
