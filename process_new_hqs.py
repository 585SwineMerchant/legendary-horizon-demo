import os
import glob
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
    brain_dir = r"C:\Users\kevin\.gemini\antigravity\brain\00dd8f8e-dd03-4e91-8e7f-250ac2ab5d8e"
    
    guild_mapping = {
        "Aethelwood Farmsteads": "aethelwood_farmsteads_*.png",
        "Alchemical Observatory": "alchemical_observatory_*.png",
        "Archives of Ascension": "archives_of_ascension_*.png",
        "Aurora Apothecary": "aurora_apothecary_*.png",
        "Bard's Beacon": "bards_beacon_*.png",
        "Chronicler's Spire": "chroniclers_spire_*.png",
        "Crossroads Haven": "crossroads_haven_*.png",
        "Empathy's Enclave": "empathys_enclave_*.png",
        "Etheric Nexus": "etheric_nexus_*.png",
        "Guilded Vault": "guilded_vault_*.png",
        "High Council Hall": "high_council_hall_*.png",
        "Mercantile's Citadel": "mercantiles_citadel_*.png",
        "Monolith of Masonry": "monolith_of_masonry_*.png",
        "Odysee's Harbor": "odysees_harbor_*.png",
        "Valor's Watchtower": "valors_watchtower_*.png",
        "Vulcanis Forge": "vulcanis_forge_*.png"
    }
    
    # Target size is 256x256 (8x8 tiles of 32px)
    cell_size = 256
    padding = 16 
    
    output_dir = os.path.join('Tilesets', 'New_Guild_HQs')
    os.makedirs(output_dir, exist_ok=True)
    
    tsx_template = """<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.12.1" name="{name}" tilewidth="32" tileheight="32" tilecount="64" columns="8">
 <image source="Tilesets/New_Guild_HQs/{filename}" width="256" height="256"/>
</tileset>
"""
    
    for guild_name, pattern in guild_mapping.items():
        search_pattern = os.path.join(brain_dir, pattern)
        matches = glob.glob(search_pattern)
        if not matches:
            print(f"Warning: No match found for {guild_name} with pattern {pattern}")
            continue
            
        path = matches[0]
        print(f"Processing: {guild_name} from {path}")
            
        img = Image.open(path).convert('RGBA')
        building = get_building(img)
        
        # Calculate resize ratio to fit within cell_size - padding*2
        max_w = cell_size - padding * 2
        max_h = cell_size - padding * 2
        
        w, h = building.size
        ratio = min(max_w / w, max_h / h)
        new_w = int(w * ratio)
        new_h = int(h * ratio)
        
        building = building.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        final_img = Image.new('RGBA', (cell_size, cell_size), (0, 0, 0, 0))
        
        x = (cell_size - new_w) // 2
        y = (cell_size - new_h - padding)
        
        final_img.paste(building, (x, y), building)
        
        out_filename = f"{guild_name}.png"
        output_path = os.path.join(output_dir, out_filename)
        final_img.save(output_path)
        
        tsx_content = tsx_template.format(name=guild_name, filename=out_filename)
        tsx_path = f"{guild_name}_v2.tsx"
        with open(tsx_path, "w", encoding="utf-8") as f_tsx:
            f_tsx.write(tsx_content)
            
        print(f"Saved tileset to {output_path} and {tsx_path}")

if __name__ == '__main__':
    main()
