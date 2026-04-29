import json
import random

W = 250
H = 250

grass_gid = 496
cliff_gid = 651
water_gid = 2157

ground_data = [grass_gid] * (W * H)
water_data = [0] * (W * H)
mountain_data = [0] * (W * H)

def set_tile(data, x, y, gid):
    if 0 <= x < W and 0 <= y < H:
        data[y * W + x] = gid

def add_rect(data, x, y, w, h, gid):
    for j in range(y, y+h):
        for i in range(x, x+w):
            set_tile(data, i, j, gid)

# Oceans
add_rect(water_data, 0, 0, W, 2, water_gid) # North
add_rect(water_data, 0, H-2, W, 2, water_gid) # South
add_rect(water_data, 0, 0, 2, H, water_gid) # West
add_rect(water_data, W-2, 0, 2, H, water_gid) # East

# Harbor bay (southeast)
add_rect(water_data, 218, 234, 32, 16, water_gid)

# Rivers
add_rect(water_data, 56, 93, 75, 2, water_gid)
add_rect(water_data, 175, 75, 50, 2, water_gid)
add_rect(water_data, 87, 168, 56, 2, water_gid)
add_rect(water_data, 162, 181, 44, 2, water_gid)
add_rect(water_data, 115, 131, 2, 44, water_gid)

# Mountains
add_rect(mountain_data, 62, 9, 94, 13, cliff_gid)
add_rect(mountain_data, 231, 31, 19, 56, cliff_gid)
add_rect(mountain_data, 12, 212, 19, 38, cliff_gid)
add_rect(mountain_data, 56, 231, 38, 13, cliff_gid)
add_rect(mountain_data, 237, 150, 13, 25, cliff_gid)

map_json = {
    "width": W,
    "height": H,
    "tilewidth": 32,
    "tileheight": 32,
    "orientation": "orthogonal",
    "renderorder": "right-down",
    "type": "map",
    "version": "1.10",
    "tiledversion": "1.10.0",
    "tilesets": [
        {
            "columns": 38,
            "firstgid": 1,
            "image": "Tilesets/grasssheet.png",
            "imageheight": 512,
            "imagewidth": 1232,
            "margin": 0,
            "name": "grasssheet",
            "spacing": 0,
            "tilecount": 608,
            "tileheight": 32,
            "tilewidth": 32
        },
        {
            "columns": 36,
            "firstgid": 609,
            "image": "Tilesets/cliffsheet.png",
            "imageheight": 1392,
            "imagewidth": 1152,
            "margin": 0,
            "name": "cliffsheet",
            "spacing": 0,
            "tilecount": 1548,
            "tileheight": 32,
            "tilewidth": 32
        },
        {
            "columns": 29,
            "firstgid": 2157,
            "image": "Tilesets/watersheet.png",
            "imageheight": 416,
            "imagewidth": 928,
            "margin": 0,
            "name": "watersheet",
            "spacing": 0,
            "tilecount": 377,
            "tileheight": 32,
            "tilewidth": 32
        }
    ],
    "layers": [
        {
            "data": ground_data,
            "height": H,
            "id": 1,
            "name": "Ground",
            "opacity": 1,
            "type": "tilelayer",
            "visible": True,
            "width": W,
            "x": 0,
            "y": 0
        },
        {
            "data": water_data,
            "height": H,
            "id": 2,
            "name": "Water",
            "opacity": 1,
            "type": "tilelayer",
            "visible": True,
            "width": W,
            "x": 0,
            "y": 0
        },
        {
            "data": mountain_data,
            "height": H,
            "id": 3,
            "name": "Mountains",
            "opacity": 1,
            "type": "tilelayer",
            "visible": True,
            "width": W,
            "x": 0,
            "y": 0
        }
    ]
}

with open("world_map.json", "w") as f:
    json.dump(map_json, f)

print("Generated world_map.json successfully!")
