"""Rasterize the canonical layered scene; photographic contents stay in its SVG."""
import argparse
import ctypes as C
import os
import tempfile
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--preview',type=Path)
args=parser.parse_args()
rsvg=C.CDLL('librsvg-2.so.2');cairo=C.CDLL('libcairo.so.2');go=C.CDLL('libgobject-2.0.so.0')
rsvg.rsvg_handle_new_from_file.argtypes=[C.c_char_p,C.c_void_p];rsvg.rsvg_handle_new_from_file.restype=C.c_void_p
rsvg.rsvg_handle_render_cairo.argtypes=[C.c_void_p,C.c_void_p];rsvg.rsvg_handle_render_cairo.restype=C.c_bool
cairo.cairo_image_surface_create.argtypes=[C.c_int,C.c_int,C.c_int];cairo.cairo_image_surface_create.restype=C.c_void_p
cairo.cairo_create.argtypes=[C.c_void_p];cairo.cairo_create.restype=C.c_void_p
cairo.cairo_surface_write_to_png.argtypes=[C.c_void_p,C.c_char_p];cairo.cairo_surface_write_to_png.restype=C.c_int
cairo.cairo_destroy.argtypes=[C.c_void_p];cairo.cairo_surface_destroy.argtypes=[C.c_void_p];go.g_object_unref.argtypes=[C.c_void_p]
svg=root/'tools/artwork/foundations-story/collage.svg'
handle=rsvg.rsvg_handle_new_from_file(str(svg).encode(),None);assert handle
surface=cairo.cairo_image_surface_create(0,1600,2200);context=cairo.cairo_create(surface)
try:
 assert rsvg.rsvg_handle_render_cairo(handle,context)
 with tempfile.TemporaryDirectory() as temporary:
  png=Path(temporary)/'scene.png'
  assert cairo.cairo_surface_write_to_png(surface,str(png).encode())==0
  im=Image.open(png).convert('RGB')
  out=root/'assets/collage/catalog'
  for width in [720,1200]:
   target=out/f'foundations-story-{width}.webp';tmp=target.with_suffix('.webp.tmp')
   im.resize((width,round(width*11/8)),Image.Resampling.LANCZOS).save(tmp,format='WEBP',quality=91,method=6)
   os.replace(tmp,target)
  if args.preview:
   im.resize((800,1100),Image.Resampling.LANCZOS).save(args.preview,quality=96)
finally:
 cairo.cairo_destroy(context);cairo.cairo_surface_destroy(surface);go.g_object_unref(handle)
print('Rendered the scene without the ornament sample sheet')
