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
    files = sorted([f for f in os.listdir(hq_dir) if f.endswith('.png')])
    
    # Target grid is 4x4, each cell is 256x256 (8x8 tiles of 32px)
    cell_size = 256
    padding = 16 # Add a little padding so they don't touch the edges
    
    spritesheet = Image.new('RGBA', (cell_size * 4, cell_size * 4), (0, 0, 0, 0))
    
    for idx, f in enumerate(files):
        print(f"Processing {idx+1}/16: {f}")
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
        
        # Paste into the cell, centered horizontally and aligned to bottom vertically
        row = idx // 4
        col = idx % 4
        
        x = col * cell_size + (cell_size - new_w) // 2
        y = row * cell_size + (cell_size - new_h - padding)
        
        spritesheet.paste(building, (x, y), building)
        
    os.makedirs('Tilesets', exist_ok=True)
    output_path = os.path.join('Tilesets', 'guild_hqs_v2.png')
    spritesheet.save(output_path)
    print(f"Saved tileset to {output_path}")

if __name__ == '__main__':
    main()
