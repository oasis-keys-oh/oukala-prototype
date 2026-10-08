cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2
cat pp/p0.js pp/p1.js pp/p2.js pp/p3.js pp/p4.js pp/p5.js pp/p6.js pp/p7.js > mod_people.js && node --check mod_people.js && python3 build.py --only people --out out_people >/dev/null && node --check out_people/oukala-js.js && echo built
