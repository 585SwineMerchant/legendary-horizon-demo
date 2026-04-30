import os
import glob
from PIL import Image
from rembg import remove

def get_spritesheet(img):
    # Remove background using rembg
    out = remove(img)
    # get bounding box of non-transparent pixels
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    return out

def main():
    brain_dir = r"C:\Users\kevin\.gemini\antigravity\brain\00dd8f8e-dd03-4e91-8e7f-250ac2ab5d8e"
    
    targets = {
        "male_traveler": "male_traveler_*.png",
        "female_traveler": "female_traveler_*.png"
    }
    
    # Target size for a 3x4 sprite sheet of 32x64 characters
    target_w = 96
    target_h = 256
    
    output_dir = os.path.join('Tilesets', 'Characters')
    os.makedirs(output_dir, exist_ok=True)
    
    for name, pattern in targets.items():
        search_pattern = os.path.join(brain_dir, pattern)
        matches = glob.glob(search_pattern)
        if not matches:
            print(f"Warning: No match found for {name} with pattern {pattern}")
            continue
            
        path = matches[0]
        print(f"Processing: {name} from {path}")
            
        img = Image.open(path).convert('RGBA')
        
        # Remove background and crop to content
        spritesheet = get_spritesheet(img)
        
        # Force resize into the exact 96x256 grid
        spritesheet = spritesheet.resize((target_w, target_h), Image.Resampling.LANCZOS)
        
        out_filename = f"{name}.png"
        output_path = os.path.join(output_dir, out_filename)
        spritesheet.save(output_path)
            
        print(f"Saved sprite sheet to {output_path}")

if __name__ == '__main__':
    main()
