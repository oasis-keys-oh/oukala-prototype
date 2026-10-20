import sys
from PIL import Image
f=sys.argv[1];n=int(sys.argv[2]) if len(sys.argv)>2 else 3
im=Image.open(f);w,h=im.size;base=f[:-4]
k=0
for y in range(0,h,1000):
    if k>=n:break
    im.crop((0,y,w,min(h,y+1000))).save(f"{base}_s{k}.png");k+=1
print(h,k)
