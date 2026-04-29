import os
from PIL import Image
from rembg import remove

def get_building(img):
    # Remove background using rembg
    out = remove(img)
    # get bounding box of non-transparent pixels
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    return out

def main():
    hq_dir = 'Guild HQs'
    files = sorted([f for f in os.listdir(hq_dir) if f.endswith('.png') and f != "LH Map Final.png"])
    
    # Target size is 256x256 (8x8 tiles of 32px)
    cell_size = 256
    padding = 16 # Add a little padding so they don't touch the edges
    
    os.makedirs(os.path.join('Tilesets', 'Individual_HQs'), exist_ok=True)
    
    # We also want to generate a TSX file for each
    tsx_template = """<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.12.1" name="{name}" tilewidth="32" tileheight="32" tilecount="64" columns="8">
 <image source="Tilesets/Individual_HQs/{filename}" width="256" height="256"/>
</tileset>
"""
    
    for idx, f in enumerate(files):
        print(f"Processing {idx+1}/{len(files)}: {f}")
        path = os.path.join(hq_dir, f)
            
        img = Image.open(path).convert('RGBA')
        
        building = get_building(img)
        
        # Calculate resize ratio to fit within cell_size - padding*2
        max_w = cell_size - padding * 2
        max_h = cell_size - padding * 2
        
        w, h = building.size
        ratio = min(max_w / w, max_h / h)
        new_w = int(w * ratio)
        new_h = int(h * ratio)
        
        # Use high quality resizing
        building = building.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Create a new 256x256 image
        final_img = Image.new('RGBA', (cell_size, cell_size), (0, 0, 0, 0))
        
        # Paste into the cell, centered horizontally and aligned to bottom vertically
        x = (cell_size - new_w) // 2
        y = (cell_size - new_h - padding)
        
        final_img.paste(building, (x, y), building)
        
        name_without_ext = os.path.splitext(f)[0]
        out_filename = f"{name_without_ext}.png"
        output_path = os.path.join('Tilesets', 'Individual_HQs', out_filename)
        final_img.save(output_path)
        
        tsx_content = tsx_template.format(name=name_without_ext, filename=out_filename)
        tsx_path = f"{name_without_ext}.tsx"
        with open(tsx_path, "w", encoding="utf-8") as f_tsx:
            f_tsx.write(tsx_content)
            
        print(f"Saved tileset to {output_path} and {tsx_path}")

if __name__ == '__main__':
    main()
