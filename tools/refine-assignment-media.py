from pathlib import Path
from PIL import Image, ImageFilter
from collections import deque
ROOT=Path(__file__).resolve().parents[1]
# Remove only the near-white background connected to the image boundary.
# Interior patina, highlights and irregular bronze edges remain intact.
for path in (ROOT/'assets/collage/lectures/03').glob('task-5-[1-4].png'):
 im=Image.open(path).convert('RGBA');w,h=im.size;px=im.load();seen=set();queue=deque()
 def add(x,y):
  if (x,y) in seen:return
  r,g,b,_=px[x,y]
  if min(r,g,b)>=236 and max(r,g,b)-min(r,g,b)<18:seen.add((x,y));queue.append((x,y))
 for x in range(w):add(x,0);add(x,h-1)
 for y in range(h):add(0,y);add(w-1,y)
 while queue:
  x,y=queue.popleft()
  for a,b in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
   if 0<=a<w and 0<=b<h:add(a,b)
 mask=Image.new('L',im.size,255);mp=mask.load()
 for x,y in seen:mp[x,y]=0
 mask=mask.filter(ImageFilter.GaussianBlur(.35));im.putalpha(mask)
 box=im.getbbox();im=im.crop(box);im.save(path.with_name(path.stem+'-cutout.png'))
 print(path.name,im.size,'transparent pixels',len(seen))
