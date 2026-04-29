import base64
import os

def get_base64(file_path):
    with open(file_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def build():
    # Read files
    with open("index.html", "r") as f:
        index_html = f.read()

    # Replace Phaser CDN with full version
    index_html = index_html.replace(
        'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser-arcade-physics.min.js',
        'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js'
    )
    
    with open("src/main.js", "r") as f:
        main_js = f.read()
        
    with open("src/scenes/Overworld.js", "r") as f:
        overworld_js = f.read()
        
    with open("src/entities/Enemy.js", "r") as f:
        enemy_js = f.read()

    # Convert assets to base64
    grasssheet_b64 = get_base64("Tilesets/grasssheet.png")
    cliffsheet_b64 = get_base64("Tilesets/cliffsheet.png")
    watersheet_b64 = get_base64("Tilesets/watersheet.png")
    buildings_b64 = get_base64("Tilesets/guild_hqs_clean.png")
    
    # We still need the hero and characters
    hero_b64 = get_base64("Tilesets/hero_clean.png")
    chars_b64 = get_base64("Tilesets/characters_clean.png")

    with open("world_map.json", "r") as f:
        world_map_data = f.read()

    # We will inject the tilesets into index_html
    final_html = index_html
    final_html = final_html.replace('<img id="tiles-img" src="">', '')
    final_html = final_html.replace('<img id="hero-img" src="">', f'<img id="hero-img" src="data:image/png;base64,{hero_b64}">')
    final_html = final_html.replace('<img id="buildings-img" src="">', f'<img id="buildings-img" src="data:image/png;base64,{buildings_b64}">')
    final_html = final_html.replace('<img id="chars-img" src="">', f'<img id="chars-img" src="data:image/png;base64,{chars_b64}">')
    final_html = final_html.replace('<img id="forest-img" src="">', f'<img id="grasssheet-img" src="data:image/png;base64,{grasssheet_b64}">')
    final_html = final_html.replace('<img id="mountain-img" src="">', f'<img id="cliffsheet-img" src="data:image/png;base64,{cliffsheet_b64}">')
    final_html = final_html.replace('<img id="water-img" src="">', f'<img id="watersheet-img" src="data:image/png;base64,{watersheet_b64}">')
    final_html = final_html.replace('<img id="grass-img" src="">', '')
    final_html = final_html.replace('<img id="path-img" src="">', '')
    
    # Clean up JS (remove imports/exports for single file)
    main_js = main_js.replace("import { Overworld } from './scenes/Overworld.js';", "")
    main_js = main_js.replace("export default game;", "")
    
    overworld_js = overworld_js.replace("import { Enemy } from '../entities/Enemy.js';", "")
    overworld_js = overworld_js.replace("export class Overworld", "class Overworld")
    
    enemy_js = enemy_js.replace("export class Enemy", "class Enemy")

    # Assemble everything
    combined_js = f"""
window.worldMapData = {world_map_data};
{enemy_js}
{overworld_js}

window.gameInstance = {{
    openEvent: (id) => {{
        document.body.classList.add('modal-active');
        document.getElementById('app-container').classList.add('active');
        
        let file = '';
        if (id === 'act1') file = 'Current Scroll of Destiny.html';
        if (id === 'act2') file = 'Quest_of_Fate.html';
        if (id === 'act3') file = 'Fog of the unknown.html';

        if (file) {{
            document.getElementById('app-content').innerHTML = `<iframe id="app-iframe" src="${{file}}"></iframe>`;
        }} else {{
            document.getElementById('app-content').innerHTML = `<h1>Coming Soon: ${{id}}</h1>`;
        }}
        
        // Pause the game scene
        window.game.scene.getScene('Overworld').scene.pause();
    }},
    closeEvent: () => {{
        document.body.classList.remove('modal-active');
        document.getElementById('app-container').classList.remove('active');
        document.getElementById('app-content').innerHTML = '';
        
        // Resume the game scene
        window.game.scene.getScene('Overworld').scene.resume();
    }},
    openRealm: (realmData) => {{
        console.log("Opening Realm:", realmData.name);
        const overlay = document.getElementById('realm-overlay');
        document.getElementById('realm-name').innerText = realmData.name;
        document.getElementById('realm-cluster').innerText = realmData.cluster;
        document.getElementById('realm-image').src = encodeURIComponent(realmData.name) + ".png";
        overlay.classList.add('active');
        window.game.scene.getScene('Overworld').scene.pause();
    }},
    closeRealm: () => {{
        document.getElementById('realm-overlay').classList.remove('active');
        window.game.scene.getScene('Overworld').scene.resume();
    }},
    enterResearch: () => {{
        window.gameInstance.closeRealm();
        window.gameInstance.openEvent('act3');
    }}
}};

window.startGame = () => {{
    console.log("Starting Game...");
    document.getElementById('start-screen').style.display = 'none';
    if (window.game) {{
        window.game.input.keyboard.enabled = true;
        window.game.canvas.focus();
    }}
}};

window.onerror = function(message, source, lineno, colno, error) {{
    document.body.innerHTML += `<div style="position:fixed;top:0;left:0;background:red;color:white;z-index:9999;padding:20px;">ERROR: ${{message}}<br>${{error ? error.stack : ''}}</div>`;
}};

window.onload = () => {{
    console.log("DOM Loaded, initializing game...");
    try {{
        {main_js.replace("const game = new Phaser.Game(config);", "window.game = new Phaser.Game(config); console.log('Phaser instance created');")}
        // Disable keyboard until start button is clicked to prevent scroll issues
        window.game.input.keyboard.enabled = false;
    }} catch (e) {{
        console.error("Failed to start Phaser:", e);
        alert("Game failed to start. Check console for details.");
    }}
}};
    """
    
    # Replace the script tag in final_html
    final_html = final_html.replace('<script type="module" src="src/main.js"></script>', f'<script>{combined_js}</script>')
    
    with open("LegendaryHorizon_Playable.html", "w") as f:
        f.write(final_html)
    
    print("Successfully built LegendaryHorizon_Playable.html")

if __name__ == "__main__":
    build()
