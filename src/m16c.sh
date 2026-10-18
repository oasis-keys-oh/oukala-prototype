#!/bin/bash
# usage: m16c.sh <kind> <arg...>   kinds: eval <file|code> ; shot <png> <code> [dark] [w] ; reload ; view <dark 0|1> <w> <h>
Q=/tmp/m16q; id=c$RANDOM$RANDOM
case "$1" in
 eval) if [ -f "$2" ]; then python3 -c "import json,sys;print(json.dumps({'kind':'eval','file':sys.argv[1]}))" "$2" > $Q/$id.tmp; else python3 -c "import json,sys;print(json.dumps({'kind':'eval','code':sys.argv[1]}))" "$2" > $Q/$id.tmp; fi;;
 shot) python3 -c "import json,sys;print(json.dumps({'kind':'shot','file':sys.argv[1],'code':sys.argv[2],'full':len(sys.argv)>3 and sys.argv[3]=='full'}))" "$2" "$3" "$4" > $Q/$id.tmp;;
 reload) echo '{"kind":"reload"}' > $Q/$id.tmp;;
 view) python3 -c "import json,sys;print(json.dumps({'kind':'view','dark':sys.argv[1]=='1','w':int(sys.argv[2]),'h':int(sys.argv[3])}))" "$2" "$3" "$4" > $Q/$id.tmp;;
esac
mv $Q/$id.tmp $Q/$id.cmd
for i in $(seq 1 ${WAITS:-110}); do [ -f $Q/$id.out ] && { cat $Q/$id.out; echo; rm $Q/$id.out; exit 0; }; sleep 1; done; echo TIMEOUT
