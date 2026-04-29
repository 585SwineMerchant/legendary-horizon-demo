with open('LegendaryHorizon_Playable.html', 'r') as f:
    content = f.read()

print("grass-img has base64 data:", 'grass-img" src="data:image' in content)
print("addImage grass:", "addImage('grass'" in content) 
print("tileSprite grass:", "tileSprite(mapSizeX/2, mapSizeY/2, mapSizeX, mapSizeY, 'grass')" in content)
print("hero_clean used:", 'hero-img" src="data:image' in content)
print("forest-img has data:", 'forest-img" src="data:image' in content)
print("mountain-img has data:", 'mountain-img" src="data:image' in content)
print("water-img has data:", 'water-img" src="data:image' in content)

# Check for the old broken syntax error
print("orphaned frameWidth:", "            frameWidth: 128," in content and "            frameHeight: 128," in content)
