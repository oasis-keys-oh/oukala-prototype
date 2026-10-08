#!/bin/bash
# usage: shots.sh name screen "eval" [flags]
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2
n=$1; sc=$2; ev=$3; shift 3
NODE_PATH=$(npm root -g) node shot_itsm.js out_itsm $sc --full --eval "$ev" "$@" 2>&1 | grep -v "overflowX: false"
suf=""; for a in "$@"; do [ "$a" = "--phone" ] && suf="$suf-phone"; [ "$a" = "--dark" ] && suf="$suf-dark"; done
mv out_itsm/shots/$sc$suf.png out_itsm/shots/$n$suf.png 2>/dev/null
