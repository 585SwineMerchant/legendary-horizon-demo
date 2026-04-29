import os
from PIL import Image

hq_dir = 'Guild HQs'
for f in os.listdir(hq_dir):
    if f.endswith('.png'):
        path = os.path.join(hq_dir, f)
        img = Image.open(path)
        print(f"{f}: size={img.size}, mode={img.mode}")
