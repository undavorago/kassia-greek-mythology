"""Render only the authored cover artwork using the system SVG library."""
import ctypes as C
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
rsvg = C.CDLL('librsvg-2.so.2')
cairo = C.CDLL('libcairo.so.2')
gobject = C.CDLL('libgobject-2.0.so.0')

rsvg.rsvg_handle_new_from_file.argtypes = [C.c_char_p, C.c_void_p]
rsvg.rsvg_handle_new_from_file.restype = C.c_void_p
rsvg.rsvg_handle_render_cairo.argtypes = [C.c_void_p, C.c_void_p]
rsvg.rsvg_handle_render_cairo.restype = C.c_bool
cairo.cairo_image_surface_create.argtypes = [C.c_int, C.c_int, C.c_int]
cairo.cairo_image_surface_create.restype = C.c_void_p
cairo.cairo_create.argtypes = [C.c_void_p]
cairo.cairo_create.restype = C.c_void_p
cairo.cairo_surface_write_to_png.argtypes = [C.c_void_p, C.c_char_p]
cairo.cairo_surface_write_to_png.restype = C.c_int
cairo.cairo_destroy.argtypes = [C.c_void_p]
cairo.cairo_surface_destroy.argtypes = [C.c_void_p]
gobject.g_object_unref.argtypes = [C.c_void_p]

directory = root / 'assets/collage/catalog'
def render(name, width, height):
    handle = rsvg.rsvg_handle_new_from_file(str(root/'tools/artwork'/f'{name}.svg').encode(), None)
    assert handle, f'Unable to read {name}.svg'
    surface = cairo.cairo_image_surface_create(0, width, height)
    context = cairo.cairo_create(surface)
    assert rsvg.rsvg_handle_render_cairo(handle, context)
    png = root.parent / f'{name}-preview.png'
    assert cairo.cairo_surface_write_to_png(surface, str(png).encode()) == 0
    cairo.cairo_destroy(context)
    cairo.cairo_surface_destroy(surface)
    gobject.g_object_unref(handle)
    return Image.open(png)

cover = render('foundations-faces', 1200, 960).convert('RGB')
cover.save(directory/'foundations-faces.webp', quality=92, method=6)
cover.resize((720, 576), Image.Resampling.LANCZOS).save(directory/'foundations-faces-small.webp', quality=90, method=6)
print('Rendered the cover at 1200/720 pixels ')
