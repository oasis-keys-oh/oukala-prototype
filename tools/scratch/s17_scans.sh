export NODE_PATH=$(npm root -g)
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2
node spacescan.js out_s17 --dark --only r17s_rules > out_s17/sp_dark.log 2>&1
node spacescan.js out_s17 --phone --only r17s_rules > out_s17/sp_phone.log 2>&1
node perm_test.js out_s17 --quiet > out_s17/perm.log 2>&1
node allscreens.js out_s17 > out_s17/all.log 2>&1
node allscreens.js out_s17 --phone > out_s17/allp.log 2>&1
echo done > out_s17/scans.done
