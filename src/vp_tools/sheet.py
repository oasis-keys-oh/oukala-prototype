import sys
from PIL import Image
# sheet.py out y0 h files...
out=sys.argv[1];y0=int(sys.argv[2]);h=int(sys.argv[3]);fs=sys.argv[4:]
ims=[Image.open(f).crop((0,y0,400,y0+h)) for f in fs]
W=sum(i.width for i in ims)+10*(len(ims)-1)
s=Image.new('RGB',(W,h),'white');x=0
for i in ims:s.paste(i,(x,0));x+=i.width+10
s.save(out)
