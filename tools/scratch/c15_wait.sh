#!/bin/bash
# usage: c15_wait.sh name [maxsec]
for i in $(seq 1 ${2:-100}); do grep -q "^DONE" /tmp/c15_$1.log 2>/dev/null && break; sleep 1; done; cat /tmp/c15_$1.log | head -${3:-80}
