import sys
from PIL import Image
files=sys.argv[2:];out=sys.argv[1]
ims=[Image.open(f).convert('RGB') for f in files]
w,h=720,450
cols=2;rows=(len(ims)+1)//2
sheet=Image.new('RGB',(w*cols,h*rows),'white')
for i,im in enumerate(ims):
    sheet.paste(im.resize((w,h)),((i%cols)*w,(i//cols)*h))
sheet.save(out)
