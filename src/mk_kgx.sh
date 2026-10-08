#!/bin/bash
cd "$(dirname "$0")"
cat kgx_parts/01_engine.js kgx_parts/02_data.js kgx_parts/03_screen.js > mod_kgx.js
node --check mod_kgx.js
