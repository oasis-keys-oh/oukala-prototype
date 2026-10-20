#!/bin/sh
cd "$(dirname "$0")"
export NODE_PATH=$(npm root -g)
for s in dark light; do node b14_flow_t.js $s > out_b14/ft_$s.log 2>&1; done; node b14_draw_t.js dark > out_b14/dt_dark.log 2>&1
echo done > out_b14/all.done
