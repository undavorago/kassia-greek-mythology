"""One portrait, three media: marble, painted flesh, and the words of Homer.

A native SVG collage that combines text, sculptural form and one painted scene.
No new raster illustrations or generative edits are used for this composition.
"""
from pathlib import Path
from base64 import b64encode
from io import BytesIO
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'tools/artwork'

def uri(name, limit=3400):
 im=Image.open(ROOT/'assets/collage'/name)
 im.thumbnail((limit,limit*2));buf=BytesIO()

 if im.mode=='RGBA':
  im.save(buf,format='PNG');mime='image/png'
 else:
  im.convert('RGB').save(buf,format='JPEG',quality=95);mime='image/jpeg'
 return 'data:'+mime+';base64,'+b64encode(buf.getvalue()).decode()

def image(name,x,y,w,h,extra=''):
 return f'<image x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="none" xlink:href="{uri(name)}" {extra}/>'

svg=['''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="960" viewBox="0 0 1200 960">
<title>Основы. У мифа нет единственного лица</title><desc>Внутри мраморного лица Зевса открывается сцена с картины Буше: тот же бог в облике Дианы обращается к Каллисто. Папирус «Одиссеи» продолжается в портрет: у мифа нет единственного лица.</desc>
<defs>
 <filter id="ivory"><feColorMatrix type="matrix" values=".30 .48 .13 0 .05 .27 .46 .13 0 .04 .22 .40 .14 0 .02 0 0 0 1 0"/></filter>
 <filter id="paper"><feColorMatrix type="matrix" values=".35 .40 .10 0 .15 .25 .40 .10 0 .10 .15 .30 .10 0 .08 0 0 0 1 0"/></filter>
 <linearGradient id="night" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#203a4a"/><stop offset=".65" stop-color="#284b5b"/><stop offset="1" stop-color="#466673"/></linearGradient>
 <clipPath id="story-window"><path d="M455 235L923 329 826 785 358 691Z"/></clipPath>
''']
# Reusable photos keep the editable source small.
svg.append('<g id="head">')
svg.append(image('catalog/zeus-cutout.png',230,-25,735,980,'filter="url(#ivory)"'))
svg.append('</g>')
svg.append('<filter id="white-alpha"><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/></filter><mask id="portrait-shape" x="0" y="0" width="1200" height="960" maskUnits="userSpaceOnUse"><use xlink:href="#head" filter="url(#white-alpha)"/></mask><clipPath id="word-half"><path d="M0 0H530L520 110 534 170 520 220 533 270 517 330 532 385 520 440 533 500 520 555 532 615 518 675 531 735 520 795 530 855 518 960H0Z"/></clipPath></defs><rect width="1200" height="960" fill="#e9dec7"/><rect x="18" y="18" width="1164" height="924" fill="url(#night)"/>')
# The same painting supplies a faint, continuous material texture behind the portrait.
svg.append('<svg x="18" y="18" width="1164" height="924" viewBox="50 980 900 720" preserveAspectRatio="none" opacity=".16">')
svg.append(image('catalog/jupiter-callisto.webp',0,0,3263,3860))
svg.append('</svg>')
svg.append('<use xlink:href="#head"/>')
# Ancient words replace the left third of this very same head, following its silhouette.
svg.append('<g mask="url(#portrait-shape)"><g clip-path="url(#word-half)">')
svg.append('<svg x="200" y="0" width="350" height="960" viewBox="244 310 64 130" preserveAspectRatio="none">')
svg.append(image('catalog/odyssey-papyrus-detail.webp',0,0,600,600,'filter="url(#paper)"'))
svg.append('</svg></g></g>')
# One connected cut reveals the same god wearing a different face.
svg.append('<g mask="url(#portrait-shape)">')
svg.append('<g clip-path="url(#story-window)">')
svg.append('<svg x="358" y="235" width="565" height="550" viewBox="1320 1120 1200 1400" preserveAspectRatio="xMidYMid slice">')
svg.append(image('catalog/jupiter-callisto.webp',0,0,3263,3860))
svg.append('</svg></g>')
svg.append('''<path d="M455 235L923 329" stroke="#d6c7aa" stroke-opacity=".65" fill="none" stroke-width="1"/>
<path d="M358 691L826 785" stroke="#182e3c" stroke-opacity=".65" fill="none" stroke-width="4"/>
</g></svg>''')
OUT.mkdir(exist_ok=True)
output='\n'.join(svg)
painting=image('catalog/jupiter-callisto.webp',0,0,3263,3860)
output=output.replace(painting,'<use xlink:href="#painted-scene"/>')
output=output.replace('</defs>',f'<g id="painted-scene">{painting}</g></defs>')
(OUT/'foundations-faces.svg').write_text(output)
print('Authored tools/artwork/foundations-faces.svg')

