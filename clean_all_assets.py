"""
Clean all game assets:
1. hero.png -> hero_clean.png (white background -> transparent)
2. tileset.png -> extract a clean grass tile for seamless tiling
3. characters.png -> characters_clean.png (already done, verify)
"""
from PIL import Image
import numpy as np
import math

def remove_background(img_path, out_path, bg_color=(255, 255, 255), threshold=40):
    """Remove background color from an image using Euclidean distance."""
    img = Image.open(img_path).convert("RGBA")
    data = np.array(img)
    
    # Calculate Euclidean distance from bg_color
    r, g, b = bg_color
    dist = np.sqrt(
        (data[:,:,0].astype(float) - r)**2 +
        (data[:,:,1].astype(float) - g)**2 +
        (data[:,:,2].astype(float) - b)**2
    )
    
    # Set alpha to 0 where close to bg color
    data[:,:,3] = np.where(dist < threshold, 0, 255)
    
    result = Image.fromarray(data)
    result.save(out_path)
    print(f"  Cleaned: {img_path} -> {out_path}")

def extract_grass_tile(tileset_path, out_path, tile_size=128):
    """
    Extract the cleanest grass region from the tileset.
    The top-left tile (0,0) is grass but has grid lines.
    We'll extract the inner portion and scale it up to avoid borders.
    """
    img = Image.open(tileset_path).convert("RGBA")
    
    # The grass tile is at (0,0) with size 128x128
    # But grid lines are 1-2px wide at the borders
    # Extract inner region (avoid borders) and tile it
    margin = 4  # pixels to skip from edges
    grass_region = img.crop((margin, margin, tile_size - margin, tile_size - margin))
    
    # Scale back up to tile_size x tile_size
    grass_tile = grass_region.resize((tile_size, tile_size), Image.NEAREST)
    grass_tile.save(out_path)
    print(f"  Extracted grass tile: {out_path}")

def create_seamless_grass(out_path, size=128):
    """Create a simple procedural grass tile."""
    import random
    random.seed(42)
    
    img = Image.new("RGBA", (size, size))
    data = np.array(img)
    
    for y in range(size):
        for x in range(size):
            # Base green with variation
            base_g = 120 + random.randint(-15, 15)
            base_r = 60 + random.randint(-10, 10) 
            base_b = 30 + random.randint(-8, 8)
            data[y, x] = [base_r, base_g, base_b, 255]
    
    result = Image.fromarray(data)
    result.save(out_path)
    print(f"  Created procedural grass: {out_path}")

if __name__ == "__main__":
    print("=== Asset Cleanup ===")
    
    # 1. Clean hero sprite (white bg -> transparent)
    print("\n1. Cleaning hero.png...")
    remove_background("hero.png", "hero_clean.png", bg_color=(255, 255, 255), threshold=30)
    
    # 2. Clean tileset - extract grass tile without borders
    print("\n2. Extracting clean grass tile...")
    extract_grass_tile("tileset.png", "grass_tile.png")
    
    # 3. Also create a procedural grass as fallback
    print("\n3. Creating procedural grass tile...")
    create_seamless_grass("grass_procedural.png")
    
    # 4. Verify characters_clean exists
    print("\n4. Checking characters_clean.png...")
    try:
        img = Image.open("characters_clean.png")
        print(f"  OK: {img.size}, Mode: {img.mode}")
    except:
        print("  Missing! Cleaning characters.png...")
        remove_background("characters.png", "characters_clean.png", bg_color=(200, 200, 200), threshold=50)
    
    # 5. Verify guild_hqs_clean exists
    print("\n5. Checking guild_hqs_clean.png...")
    try:
        img = Image.open("guild_hqs_clean.png")
        print(f"  OK: {img.size}, Mode: {img.mode}")
    except:
        print("  Missing! Cleaning guild_hqs.png...")
        remove_background("guild_hqs.png", "guild_hqs_clean.png", bg_color=(200, 200, 200), threshold=50)
    
    print("\n=== Done ===")
