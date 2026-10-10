#!/bin/bash
cd "$(dirname "$0")"
{ cat nav_parts/01_core.js nav_parts/02_chrome.js nav_parts/03_search.js nav_parts/04_contract.js nav_parts/05_studio.js; } > mod_nav.js
node --check mod_nav.js && echo "mod_nav ok $(wc -c < mod_nav.js)"
