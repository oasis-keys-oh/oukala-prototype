#!/bin/bash
# usage: c15_bg.sh name cmd...   runs in background, output /tmp/c15_<name>.log, marker line DONE at end
n=$1; shift
( "$@" > /tmp/c15_$n.log 2>&1; echo "DONE rc=$?" >> /tmp/c15_$n.log ) &
