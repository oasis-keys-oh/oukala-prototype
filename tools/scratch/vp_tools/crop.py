import sys,os
from PIL import Image
# crop.py file y0 h [x0]
f=sys.argv[1];y0=int(sys.argv[2]);h=int(sys.argv[3]);x0=int(sys.argv[4]) if len(sys.argv)>4 else 290
im=Image.open(f);w,H=im.size
b=os.path.basename(f)[:-4]
o=f'vp_shots/sl/{b}_c{y0}.png'
im.crop((x0,min(y0,H-10),w,min(H,y0+h))).save(o);print(o,H)
