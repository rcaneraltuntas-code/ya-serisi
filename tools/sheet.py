import sys, glob
from PIL import Image
d, out, cols = sys.argv[1], sys.argv[2], int(sys.argv[3])
fs = sorted(glob.glob(d + '/*.png'), key=lambda p: (int(''.join(c for c in p.split('/')[-1] if c.isdigit()) or 0), p))
ims = [Image.open(f) for f in fs]
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (w * cols, h * rows))
for i, im in enumerate(ims):
    sheet.paste(im, ((i % cols) * w, (i // cols) * h))
sheet.save(out, quality=88); print(sheet.size, [f.split('/')[-1] for f in fs])
