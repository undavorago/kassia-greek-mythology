"""Cut out existing photographs and engravings.

Sources are retained in assets/collage. Colour masks remove their neutral
backgrounds; the original subjects and textures are preserved.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

root = Path(__file__).resolve().parents[1]
assets = root / 'assets/collage'
out = assets / 'rules'
out.mkdir(exist_ok=True)

def warm_cutout(source, destination, size, low, high, close):
    im = Image.open(assets / source).convert('RGBA')
    im.thumbnail(size, Image.Resampling.LANCZOS)
    rgb = np.asarray(im).astype(float)
    warmth = (rgb[:, :, 0] + rgb[:, :, 1]) / 2 - rgb[:, :, 2]
    alpha = Image.fromarray(np.uint8(np.clip((warmth-low)/(high-low), 0, 1)*255))
    alpha = alpha.filter(ImageFilter.MedianFilter(3))
    alpha = alpha.filter(ImageFilter.MaxFilter(close)).filter(ImageFilter.MinFilter(close))
    im.putalpha(alpha)
    im = im.crop(im.getbbox())
    im.save(out / destination, quality=91, method=6)

warm_cutout('laurel-hand.webp', 'laurel-hand-cutout.webp', (400,400), 3, 13, 3)
warm_cutout('catalog/odyssey-papyrus-detail.webp', 'papyrus-cutout.webp', (1200,1200), 6, 18, 5)

# Restrict the noisy photographic background to the actual silhouette.
hand = Image.open(assets / 'laurel-hand.webp').convert('RGBA')
mask = Image.new('L', hand.size)
draw = ImageDraw.Draw(mask)
draw.polygon([(400,301),(351,291),(302,278),(287,265),(289,250),(310,235),
 (313,224),(337,213),(335,203),(349,191),(334,187),(338,173),(317,171),
 (334,150),(309,150),(320,135),(299,135),(303,120),(283,118),(288,104),
 (271,105),(258,85),(242,73),(217,65),(229,83),(211,82),(223,96),
 (202,95),(184,102),(176,90),(158,95),(144,85),(143,100),(128,102),
 (123,96),(117,113),(104,103),(102,124),(86,118),(84,138),(72,138),
 (74,164),(63,159),(67,179),(58,184),(72,209),(52,199),(45,211),
 (62,226),(37,236),(56,245),(49,257),(69,263),(84,277),(111,282),
 (137,292),(164,296),(167,284),(181,291),(193,281),(201,294),
 (218,294),(231,288),(250,306),(284,328),(318,352),(357,378),(400,400)],fill=255)
rgb = np.asarray(hand).astype(float)
warmth = (rgb[:,:,0]+rgb[:,:,1])/2-rgb[:,:,2]
colour_mask = np.uint8(np.clip((warmth-10)/7,0,1)*255)
colour_mask = Image.fromarray(colour_mask).filter(ImageFilter.MedianFilter(3))
alpha = Image.fromarray(np.minimum(np.asarray(mask),np.asarray(colour_mask)))
# Keep the hand and forearm solid, including their darker shadows.
ImageDraw.Draw(alpha).polygon([(143,205),(165,208),(185,213),(207,216),
 (233,218),(249,237),(270,263),(298,279),(352,292),(399,302),
 (399,399),(343,369),(290,332),(252,308),(224,287),(211,279),
 (199,270),(189,271),(174,260),(167,249),(153,248),(146,238),
 (146,225),(137,216)],fill=255)
hand.putalpha(alpha.filter(ImageFilter.GaussianBlur(.35)))
hand.crop(hand.getbbox()).save(out/'laurel-hand-cutout.webp',quality=92,method=6)

cloud = Image.open(assets / 'cloud.webp').convert('RGBA')
for point in [(0,0),(cloud.width-1,0),(0,cloud.height-1),(cloud.width-1,cloud.height-1)]:
    ImageDraw.floodfill(cloud, point, (255,255,255,0), thresh=25)
cloud.crop(cloud.getbbox()).save(out / 'cloud-cutout.webp', quality=92, method=6)

# A distinct background for lecture 1.1: surviving lines of the Odyssey.
papyrus = Image.open(assets / 'catalog/odyssey-papyrus-detail.webp').convert('RGB')
strip = ImageOps.fit(papyrus.crop((1170,290,2010,1080)), (1000,300))
strip.save(assets / 'catalog/lessons/01-1.webp', quality=87, method=6)
