cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
cat fabparts/a.js fabparts/b.js fabparts/c.js fabparts/d.js fabparts/e.js fabparts/f.js fabparts/g.js > mod_plat_fabric.js && node --check mod_plat_fabric.js && python3 build.py --only plat_registry,plat_fabric --out out_fab >/dev/null 2>&1 && python3 build.py --out out_fab_full >/dev/null 2>&1 && echo BUILT
