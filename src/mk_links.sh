cd "$(dirname "$0")"
cat plk_parts/p1.js plk_parts/p2.js plk_parts/p3.js plk_parts/p4.js plk_parts/p5.js plk_parts/p6.js > mod_plat_links.js && node --check mod_plat_links.js && python3 build.py --out out_links_full | tail -c 100 && node --check out_links_full/oukala-js.js
