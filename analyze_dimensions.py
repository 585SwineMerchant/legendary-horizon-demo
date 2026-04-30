import os
from PIL import Image

def analyze_dir_recursive(path):
    if not os.path.exists(path):
        print(f"Dir not found: {path}")
        return
    for root, dirs, files in os.walk(path):
        for f in files:
            if f.endswith('.png'):
                file_path = os.path.join(root, f)
                with Image.open(file_path) as img:
                    if img.size[0] > 128 or img.size[1] > 128:
                        print(f"File: {os.path.relpath(file_path, path)} -> {img.size[0]}x{img.size[1]}")

base_dir = r"c:\Antigravity local\LH\Video Game"
analyze_dir_recursive(os.path.join(base_dir, "Tilesets", "ERW - Grass Land 2.0 v1.9"))
