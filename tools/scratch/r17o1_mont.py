import sys
from PIL import Image
out=sys.argv[1];fs=sys.argv[2:]
ims=[Image.open(f+'.png') for f in fs]
h=min(900,max(i.height for i in ims))
ims=[i.resize((int(i.width*h/i.height),h)) for i in ims]
W=sum(i.width for i in ims)+10*(len(ims)-1)
m=Image.new('RGB',(W,h),'white');x=0
for i in ims: m.paste(i,(x,0));x+=i.width+10
m.save(out+'.png')
