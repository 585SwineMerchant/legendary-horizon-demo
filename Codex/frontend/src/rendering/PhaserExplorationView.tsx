import { useEffect, useMemo, useRef } from 'react';

import Phaser from 'phaser';

import type { ExplorationHotspot } from '../screens/ExplorationScreen';
import type { ParsedLhMap } from '../maps/parseLhTiledMap';

type Props = {
  realmId: string;
  parsedMap: ParsedLhMap;
  hotspots: ExplorationHotspot[];
  onActivateHotspot: (interactableId: string) => void;
};

type TriggerRect = {
  interactable_id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  completed: boolean;
};

/** Static list of all tileset image keys used by the map. */
const TILESET_IMAGES = [
  'water to grass - river orientation-spritesheet',
  'Tileset-Terrain-new grass',
  'guild_hqs',
  'Tileset-Terrain',
  'tree - color scheme 4 - 1',
  'tree - color scheme 5 - 2',
  'tree - color scheme 1 - 3',
  'tree - color scheme 2 - 1',
  'tree - color scheme 3 - 2',
  'tree - color scheme 2 - 3',
  'orc melee - all animations with fx',
  'cabin',
  'Aethelwood Farmsteads',
] as const;

/**
 * Full-screen Phaser 4 world view for Legendary Horizon.
 * Uses Phaser's own loader (tilemapTiledJSON + image) in preload() so that
 * the engine handles all async loading before create() is called.
 */
export function PhaserExplorationView({ realmId, parsedMap, hotspots, onActivateHotspot }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  const triggers = useMemo((): TriggerRect[] => {
    const byId = new Map(hotspots.map((h) => [h.interactable_id, h.completed]));
    return parsedMap.triggers.map((t) => {
      const interactable_id = `${realmId}:obj:${t.tiled_object_id}`;
      const b = t.bounds;
      return {
        interactable_id,
        x: b.x,
        y: b.y,
        w: Math.max(b.width, 1),
        h: Math.max(b.height, 1),
        completed: Boolean(byId.get(interactable_id)),
      };
    });
  }, [hotspots, parsedMap.triggers, realmId]);

  useEffect(() => {
    let active = true;
    let initialized = false;
    const host = hostRef.current;
    if (!host) return;

    const initGame = (width: number, height: number) => {
      if (!active || initialized || width < 10 || height < 10) return;
      initialized = true;

      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }

      // Capture refs for use inside the scene class
      const _triggers = triggers;
      const _parsedMap = parsedMap;
      const _onActivate = onActivateHotspot;

      class LhScene extends Phaser.Scene {
        private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
        private keySpace!: Phaser.Input.Keyboard.Key;
        private player!: Phaser.Physics.Arcade.Sprite;
        private fogStatics!: Phaser.Physics.Arcade.StaticGroup;
        private triggerBodies: Array<{ rect: Phaser.GameObjects.Rectangle; meta: TriggerRect }> = [];
        private debugText?: Phaser.GameObjects.Text;

        preload() {
          // ── Diagnostics: surface loader failures immediately ──
          this.load.on('loaderror', (file: unknown) => {
            console.error('[LhScene] Loader error:', file);
          });
          this.load.on('filecomplete', (key: string, type: string) => {
            if (key === 'lh_world' || type === 'image') {
              // Keep this noisy logging scoped to map + images only.
              // (Phaser 4 emits many filecomplete events.)
              console.log(`[LhScene] Loaded file: type=${type} key=${key}`);
            }
          });

          // ── Let Phaser's loader handle the map JSON and all tileset images ──
          // Avoid a leading slash so Vite base paths / previews still work.
          this.load.tilemapTiledJSON('lh_world', 'assets/maps/Legendary_Horizon_Map.json');

          for (const name of TILESET_IMAGES) {
            const encodedName = name.replace(/ /g, '%20');
            this.load.image(name, `assets/maps/${encodedName}.png`);
          }
        }

        create() {
          try {
            // Diagnostics: capture global scene errors (helps catch swallowed exceptions)
            this.game.events.on('error', (err: unknown) => {
              console.error('[LhScene] Game error event:', err);
            });
          } catch {
            // Ignore if not supported in this Phaser build.
          }

          const map = this.make.tilemap({ key: 'lh_world' });

          const wpx = map.widthInPixels  || _parsedMap.footprint.width_px  || 12800;
          const hpx = map.heightInPixels || _parsedMap.footprint.height_px || 9600;

          this.cameras.main.setBackgroundColor(0x0b1220);
          this.physics.world.setBounds(0, 0, wpx, hpx);
          this.cameras.main.setBounds(0, 0, wpx, hpx);

          // ── Diagnostics: summarize map structure ──
          const discoveredLayerNames = (map.layers ?? [])
            .map((l) => (l as unknown as { name?: string; type?: string })?.name)
            .filter(Boolean) as string[];
          const discoveredTilesetNames = (map.tilesets ?? [])
            .map((t) => (t as unknown as { name?: string })?.name)
            .filter(Boolean) as string[];

          // Add all tilesets (name in Tiled editor ↔ image key in loader)
          const tilesets: Phaser.Tilemaps.Tileset[] = [];
          for (const name of TILESET_IMAGES) {
            try {
              const t = map.addTilesetImage(name, name);
              if (t) tilesets.push(t);
            } catch (e) {
              console.warn(`[LhScene] Could not add tileset "${name}":`, e);
            }
          }

          console.log(
            `[LhScene] Map loaded. tilesetsAdded=${tilesets.length}/${TILESET_IMAGES.length} ` +
            `mapTilesets=[${discoveredTilesetNames.join(', ')}] layers=[${discoveredLayerNames.join(', ')}] ` +
            `size=${map.width}x${map.height} tiles (${wpx}x${hpx}px) tile=${map.tileWidth}x${map.tileHeight}`,
          );

          // Render all tile layers
          const createdLayers: string[] = [];
          // Prefer dynamic creation (tolerates changes in the Tiled file).
          for (const layerData of map.layers ?? []) {
            const layerName = (layerData as unknown as { name?: string; type?: string })?.name;
            const layerType = (layerData as unknown as { name?: string; type?: string })?.type;
            if (!layerName) continue;
            if (layerType && layerType !== 'tilelayer') continue;
            try {
              const layer = map.createLayer(layerName, tilesets, 0, 0);
              if (!layer) {
                console.warn(`[LhScene] Layer "${layerName}" returned null`);
                continue;
              }
              createdLayers.push(layerName);
            } catch (e) {
              console.warn(`[LhScene] Could not create layer "${layerName}":`, e);
            }
          }

          // If dynamic discovery produced nothing, fall back to the historical list.
          if (createdLayers.length === 0) {
            const fallbackLayerNames = ['Main', 'Hillside', 'forest 4', 'Hillside 2', 'forest layer 3', 'Guild HQs'];
            for (const layerName of fallbackLayerNames) {
              try {
                const layer = map.createLayer(layerName, tilesets, 0, 0);
                if (!layer) console.warn(`[LhScene] Layer "${layerName}" returned null`);
                else createdLayers.push(layerName);
              } catch (e) {
                console.warn(`[LhScene] Could not create layer "${layerName}":`, e);
              }
            }
          }

          console.log(`[LhScene] Layers created: ${createdLayers.length ? createdLayers.join(', ') : '(none)'}`);

          // Fog regions — dark blocking rectangles
          this.fogStatics = this.physics.add.staticGroup();
          _parsedMap.fog_regions.forEach((f) => {
            const b = f.bounds;
            const r = this.add.rectangle(
              b.x + b.width / 2, b.y + b.height / 2,
              b.width, b.height,
              0x111827, 0.7,
            );
            this.physics.add.existing(r, true);
            this.fogStatics.add(r);
          });

          // Trigger zones
          _triggers.forEach((tr) => {
            const color = tr.completed ? 0x334155 : 0x22c55e;
            const rect = this.add.rectangle(
              tr.x + tr.w / 2, tr.y + tr.h / 2,
              tr.w, tr.h, color, 0.22,
            );
            rect.setStrokeStyle(1, color, 0.55);
            this.triggerBodies.push({ rect, meta: tr });
          });

          // Player dot
          const g = this.add.graphics();
          g.fillStyle(0xe2e8f0, 1);
          g.fillCircle(12, 12, 12);
          g.generateTexture('lh_player_dot', 24, 24);
          g.destroy();

          this.player = this.physics.add.sprite(wpx / 2, hpx / 2, 'lh_player_dot');
          this.player.setCollideWorldBounds(true);
          this.player.setDamping(true);
          this.player.setDrag(600, 600);
          this.player.setMaxVelocity(500, 500);

          this.physics.add.collider(this.player, this.fogStatics);

          this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
          this.keySpace = this.input.keyboard?.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE,
          ) as Phaser.Input.Keyboard.Key;

          this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
          this.cameras.main.setZoom(1.5);

          // ── Temporary on-screen debug overlay ──
          this.debugText = this.add
            .text(12, 34, '', {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '11px',
              color: '#cbd5e1',
              backgroundColor: '#0b1220cc',
              padding: { x: 8, y: 6 },
            })
            .setScrollFactor(0)
            .setDepth(1000)
            .setAlpha(0.95);

          this.add
            .text(12, 10, '⬆⬇⬅➡ Move  ·  SPACE Interact', {
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
              fontSize: '13px',
              color: '#94a3b8',
            })
            .setScrollFactor(0)
            .setDepth(999)
            .setAlpha(0.92);
        }

        update() {
          const accel = 1400;
          const body = this.player?.body as Phaser.Physics.Arcade.Body | undefined;
          if (!body) return;

          if (this.debugText) {
            const cam = this.cameras.main;
            const z = (cam.zoom ?? 1).toFixed(2);
            this.debugText.setText([
              `map tiles: ${this.cache.tilemap.has('lh_world') ? 'cached' : 'missing'}`,
              `map px: ${Math.round(cam.getBounds().width)}x${Math.round(cam.getBounds().height)}`,
              `cam: x=${Math.round(cam.scrollX)} y=${Math.round(cam.scrollY)} zoom=${z}`,
              `player: x=${Math.round(this.player.x)} y=${Math.round(this.player.y)}`,
            ]);
          }

          let ax = 0, ay = 0;
          if (this.cursors.left?.isDown)  ax -= accel;
          if (this.cursors.right?.isDown) ax += accel;
          if (this.cursors.up?.isDown)    ay -= accel;
          if (this.cursors.down?.isDown)  ay += accel;
          this.player.setAcceleration(ax, ay);
          // Important: acceleration-based movement + damping will "coast".
          // For exploration, we want immediate stop on input release.
          if (ax === 0 && ay === 0) this.player.setVelocity(0, 0);

          if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            const px = this.player.x;
            const py = this.player.y;
            const overlaps = this.triggerBodies
              .filter(({ rect }) =>
                Phaser.Geom.Intersects.RectangleToRectangle(
                  this.player.getBounds(), rect.getBounds(),
                ),
              )
              .map((row) => ({
                ...row,
                d: (row.rect.x - px) ** 2 + (row.rect.y - py) ** 2,
              }))
              .sort((a, b) => {
                if (a.meta.completed !== b.meta.completed) return a.meta.completed ? 1 : -1;
                return a.d - b.d;
              });

            const hit = overlaps[0]?.meta;
            if (hit && !hit.completed) _onActivate(hit.interactable_id);
          }
        }
      }

      const cfg: Phaser.Types.Core.GameConfig = {
        // Phaser 4 tilemaps render via GPU layers; prefer WebGL when available.
        type: Phaser.AUTO,
        parent: host,
        backgroundColor: '#0b1220',
        width,
        height,
        physics: {
          default: 'arcade',
          arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        scene: LhScene,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      };

      gameRef.current = new Phaser.Game(cfg);
    };

    // Use ResizeObserver to wait for real dimensions
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 10 && height > 10) {
          initGame(width, height);
          ro.disconnect();
          break;
        }
      }
    });
    ro.observe(host);
    initGame(host.clientWidth, host.clientHeight);

    return () => {
      active = false;
      ro.disconnect();
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [onActivateHotspot, parsedMap, realmId, triggers]);

  return (
    <div
      ref={hostRef}
      style={{
        flex: 1,
        minHeight: '0',
        minWidth: '0',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#0b1220',
      }}
      aria-label="Phaser exploration renderer"
    />
  );
}
