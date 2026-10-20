import sys
from PIL import Image
f=sys.argv[1];h=int(sys.argv[2]);im=Image.open(f);w,H=im.size;n=0
import os;b=os.path.basename(f)[:-4]
for y in range(0,H,h):
    im.crop((0,y,w,min(H,y+h))).save(f'vp_shots/sl/{b}_{n}.png');n+=1
print(b,w,H,n)
