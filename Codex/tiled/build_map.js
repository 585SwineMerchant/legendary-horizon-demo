const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, 'Legendary_Horizon_Map.tmj');
const outPath = path.join(__dirname, '../../world_map.json');

console.log('Reading map data from:', mapPath);
const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

// Process each tileset entry
for (let i = 0; i < mapData.tilesets.length; i++) {
  const ts = mapData.tilesets[i];

  // If it's an external .tsx reference, inline it
  if (ts.source) {
    console.log(`Processing tileset: ${ts.source}`);
    const tsxPath = path.resolve(__dirname, ts.source);

    if (!fs.existsSync(tsxPath)) {
      console.warn(`WARNING: Could not find tileset file at ${tsxPath}`);
      const baseName = path.basename(ts.source, '.tsx');
      mapData.tilesets[i] = {
        firstgid: ts.firstgid,
        name: baseName,
        image: `assets/maps/${baseName}.png`,
        imageheight: 0,
        imagewidth: 0,
        margin: 0,
        spacing: 0,
        tilecount: 0,
        tileheight: 32,
        tilewidth: 32,
        columns: 0,
      };
      console.log(` -> Fallback tileset generated for: ${baseName}`);
      continue;
    }

    const xml = fs.readFileSync(tsxPath, 'utf8');

    // ── Extract <tileset> attributes ──────────────────────────────────────
    const nameMatch      = xml.match(/name="([^"]+)"/);
    const tileWidthMatch = xml.match(/tilewidth="(\d+)"/);
    const tileHeightMatch= xml.match(/tileheight="(\d+)"/);
    const tileCountMatch = xml.match(/tilecount="(\d+)"/);
    const columnsMatch   = xml.match(/columns="(\d+)"/);
    const marginMatch    = xml.match(/margin="(\d+)"/);
    const spacingMatch   = xml.match(/spacing="(\d+)"/);

    // ── Extract <image> attributes (must come from the <image ...> tag specifically) ──
    // Use the full <image ...> block to avoid matching tilewidth/tileheight as width/height
    const imageTagMatch  = xml.match(/<image\b[^>]*>/);
    const imageSourceMatch = imageTagMatch
      ? imageTagMatch[0].match(/source="([^"]+\.png)"/)
      : xml.match(/source="([^"]+\.png)"/);
    const imageWidthMatch  = imageTagMatch
      ? imageTagMatch[0].match(/width="(\d+)"/)
      : null;
    const imageHeightMatch = imageTagMatch
      ? imageTagMatch[0].match(/height="(\d+)"/)
      : null;

    const tileW   = tileWidthMatch  ? parseInt(tileWidthMatch[1])  : 32;
    const tileH   = tileHeightMatch ? parseInt(tileHeightMatch[1]) : 32;
    const count   = tileCountMatch  ? parseInt(tileCountMatch[1])  : 0;
    const columns = columnsMatch    ? parseInt(columnsMatch[1])    : 0;

    // Prefer parsed image dimensions; fall back to calculating from columns × tilesize
    let imgW = imageWidthMatch  ? parseInt(imageWidthMatch[1])  : 0;
    let imgH = imageHeightMatch ? parseInt(imageHeightMatch[1]) : 0;
    if ((!imgW || imgW <= tileW) && columns > 0 && count > 0) {
      // The regex caught tilewidth instead of image width — compute from tile grid
      imgW = columns * tileW;
      imgH = Math.ceil(count / columns) * tileH;
      console.log(` -> Image dimensions computed from grid: ${imgW}x${imgH}`);
    }

    const imageBaseName = path.basename(
      imageSourceMatch ? imageSourceMatch[1] : 'unknown.png'
    );

    mapData.tilesets[i] = {
      firstgid : ts.firstgid,
      name     : nameMatch ? nameMatch[1] : path.basename(ts.source, '.tsx'),
      image    : `assets/maps/${imageBaseName}`,
      imagewidth : imgW,
      imageheight: imgH,
      margin   : marginMatch  ? parseInt(marginMatch[1])  : 0,
      spacing  : spacingMatch ? parseInt(spacingMatch[1]) : 0,
      tilecount: count,
      tilewidth: tileW,
      tileheight: tileH,
      columns  : columns,
    };

    console.log(` -> Embedded: ${mapData.tilesets[i].name} | img: ${imageBaseName} | ${imgW}x${imgH} | tiles: ${count} | cols: ${columns}`);
  } else {
    // Already-embedded tileset — fix imagewidth/imageheight if they look wrong
    const { columns, tilecount, tilewidth, tileheight } = ts;
    if (ts.imagewidth <= tilewidth && columns > 0 && tilecount > 0) {
      ts.imagewidth  = columns * tilewidth;
      ts.imageheight = Math.ceil(tilecount / columns) * tileheight;
      console.log(`Fixed embedded tileset ${ts.name}: ${ts.imagewidth}x${ts.imageheight}`);
    }
  }
}

// Save to the frontend public directory
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(mapData, null, 2), 'utf8');
console.log(`\nSuccess! Map saved to: ${outPath}`);
