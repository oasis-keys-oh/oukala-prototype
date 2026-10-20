cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/ref/parts
cat p01_head.js p02_store.js p03_graph.js p04_seed.js p05_home.js p06_ci.js p07_model.js p08_graph_ui.js p09_ingest.js p10_health.js p10b_fin.js p11_handlers.js > ../../mod_itom.js
cd ../.. && node --check mod_itom.js && python3 build.py --only itom --out out_itom | tail -1
