import sys
from PIL import Image
out=sys.argv[1];fs=sys.argv[2:]
ims=[Image.open(f) for f in fs]
h=max(i.size[1] for i in ims);w=sum(i.size[0] for i in ims)+8*(len(ims)-1)
s=Image.new('RGB',(w,h),'white');x=0
for i in ims:s.paste(i,(x,0));x+=i.size[0]+8
s.save(out)
