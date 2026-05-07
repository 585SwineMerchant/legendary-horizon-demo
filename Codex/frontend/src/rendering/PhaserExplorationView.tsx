import { useEffect, useRef } from 'react';

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
  kind: string;
  activation_mode?: 'interaction' | 'overlap_auto' | 'overlap_auto_bottom';
  rotation_deg?: number;
  x: number;
  y: number;
  w: number;
  h: number;
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

const TRAVELER_DIRECTIONS = ['down', 'left', 'right', 'up'] as const;
type TravelerDirection = (typeof TRAVELER_DIRECTIONS)[number];
const TRAVELER_VISIBLE_FRAME_INDICES = [1, 4, 7, 10, 13, 16, 19, 22] as const;
const SOLID_TILE_LAYER_NAMES = new Set(['Hillside', 'Hillside 2', 'forest 4', 'forest layer 3']);

/**
 * Grounded top-down movement: constant-speed vector (no accel slide). Input is normalized so diagonals
 * match cardinals. Tune FPS vs speed together — ~8 visible stride frames per full cycle.
 */
const TRAVELER_MOVE_SPEED_PX = 128;
const TRAVELER_RUN_ANIM_FPS = 12;

/** Sprint (hold R while moving). Fuel drains only during sprint movement; cooldown starts when fuel hits 0. */
const TRAVELER_SPRINT_SPEED_PX = 188;
const SPRINT_FUEL_MAX_MS = 2400;
const SPRINT_COOLDOWN_MS = 5200;
const SPRINT_RUN_ANIM_TIME_SCALE = 1.22;

function publicAssetUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  const withSlash = base.endsWith('/') ? base : `${base}/`;
  return `${withSlash}${path.replace(/^\/+/, '')}`;
}

/**
 * Full-screen Phaser 4 world view for Legendary Horizon.
 * Uses Phaser's own loader (tilemapTiledJSON + image) in preload() so that
 * the engine handles all async loading before create() is called.
 */
export function PhaserExplorationView({ realmId, parsedMap, hotspots, onActivateHotspot }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // Keep Phaser instance stable. Hotspot completion changes should NOT tear down/recreate the game.
  const onActivateHotspotRef = useRef(onActivateHotspot);
  const parsedMapRef = useRef(parsedMap);
  const completionByIdRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    onActivateHotspotRef.current = onActivateHotspot;
  }, [onActivateHotspot]);

  useEffect(() => {
    parsedMapRef.current = parsedMap;
  }, [parsedMap]);

  useEffect(() => {
    completionByIdRef.current = new Map(hotspots.map((h) => [h.interactable_id, h.completed]));
  }, [hotspots]);

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
      const _parsedMap = parsedMapRef.current;
      const _completionById = completionByIdRef;
      const _onActivate = (interactableId: string) => onActivateHotspotRef.current(interactableId);
      const _triggers: TriggerRect[] = _parsedMap.triggers.map((t) => {
        const interactable_id = `${realmId}:obj:${t.tiled_object_id}`;
        const b = t.bounds;
        return {
          interactable_id,
          kind: t.kind,
          activation_mode: t.activation_mode,
          rotation_deg: t.rotation_deg,
          x: b.x,
          y: b.y,
          w: Math.max(b.width, 1),
          h: Math.max(b.height, 1),
        };
      });
      const _mapUrl = publicAssetUrl('assets/maps/Legendary_Horizon_Map.json');
      const _tilesetUrl = (name: string) => publicAssetUrl(`assets/maps/${name.replace(/ /g, '%20')}.png`);
      const _travelerUrl = (sheet: string, dir: TravelerDirection) =>
        publicAssetUrl(`assets/player/adventurer/${sheet}_${dir}.png`);
      const _travelerAttackUrl = (dir: TravelerDirection) =>
        publicAssetUrl(`assets/player/adventurer/attack_${dir}.png`);

      class LhScene extends Phaser.Scene {
        private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
        private keySpace!: Phaser.Input.Keyboard.Key;
        private keyAttack!: Phaser.Input.Keyboard.Key;
        private keySprint!: Phaser.Input.Keyboard.Key;
        private player!: Phaser.Physics.Arcade.Sprite;
        private fogStatics!: Phaser.Physics.Arcade.StaticGroup;
        private solidStatics!: Phaser.Physics.Arcade.StaticGroup;
        private triggerBodies: Array<{ rect: Phaser.GameObjects.Rectangle; meta: TriggerRect }> = [];
        private portalSprites = new Map<string, Phaser.GameObjects.Sprite>();
        private portalActivating = new Set<string>();
        private activatedInteractableIds = new Set<string>();
        private portalCooldownUntil = new Map<string, number>();
        private lastMaiaPortalId: string | null = null;
        private maiaHandoffPaused = false;
        private triggerTransitionLocked = false;
        private attackingUntil = 0;
        /** Milliseconds of sprint remaining this burst (refills after cooldown when R released). */
        private sprintFuelMs = SPRINT_FUEL_MAX_MS;
        /** Scene time (ms) until sprint can drain/refuel again. */
        private sprintCooldownUntil = 0;
        private debugText?: Phaser.GameObjects.Text;
        private facing: TravelerDirection = 'down';

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
          this.load.tilemapTiledJSON('lh_world', _mapUrl);

          for (const name of TILESET_IMAGES) {
            this.load.image(name, _tilesetUrl(name));
          }

          for (const dir of TRAVELER_DIRECTIONS) {
            this.load.spritesheet(`lh_traveler_idle_${dir}`, _travelerUrl('idle', dir), {
              frameWidth: 32,
              frameHeight: 80,
            });
            this.load.spritesheet(`lh_traveler_run_${dir}`, _travelerUrl('run', dir), {
              frameWidth: 32,
              frameHeight: 80,
            });
            // Optional: attack sheets (not required for runtime; will gracefully fallback if missing).
            this.load.spritesheet(`lh_traveler_attack_${dir}`, _travelerAttackUrl(dir), {
              frameWidth: 32,
              frameHeight: 80,
            });
          }

          this.load.spritesheet('lh_maia_portal_idle', publicAssetUrl('assets/maps/portal-grassland-activated-loop.png'), {
            frameWidth: 288,
            frameHeight: 192,
          });
          this.load.spritesheet('lh_maia_portal_activate', publicAssetUrl('assets/maps/portal-grassland-activating.png'), {
            frameWidth: 288,
            frameHeight: 192,
          });
          this.load.spritesheet('lh_maia_portal_deactivate', publicAssetUrl('assets/maps/portal-grassland-deactivating.png'), {
            frameWidth: 288,
            frameHeight: 192,
          });
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
          const solidLayers: Array<Phaser.Tilemaps.TilemapLayer | Phaser.Tilemaps.TilemapGPULayer> = [];
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
              if (SOLID_TILE_LAYER_NAMES.has(layerName)) {
                layer.setCollisionByExclusion([-1], true);
                solidLayers.push(layer);
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
                else {
                  if (SOLID_TILE_LAYER_NAMES.has(layerName)) {
                    layer.setCollisionByExclusion([-1], true);
                    solidLayers.push(layer);
                  }
                  createdLayers.push(layerName);
                }
              } catch (e) {
                console.warn(`[LhScene] Could not create layer "${layerName}":`, e);
              }
            }
          }

          console.log(`[LhScene] Layers created: ${createdLayers.length ? createdLayers.join(', ') : '(none)'}`);

          // Fog regions — dark blocking rectangles
          this.fogStatics = this.physics.add.staticGroup();
          this.solidStatics = this.physics.add.staticGroup();
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
            if (tr.kind === 'maia_portal' && this.textures.exists('lh_maia_portal_idle')) {
              const portal = this.add.sprite(tr.x + tr.w / 2, tr.y + tr.h, 'lh_maia_portal_idle');
              const scale = Phaser.Math.Clamp(Math.max(tr.h, 72) / 192, 0.48, 1.2);
              portal.setScale(scale);
              portal.setOrigin(0.5, 1);
              portal.setDepth(42);
              this.portalSprites.set(tr.interactable_id, portal);

              const portalBlock = this.add.rectangle(
                tr.x + tr.w / 2,
                tr.y + tr.h * 0.38,
                Math.max(tr.w * 2.2, 80),
                Math.max(tr.h * 0.46, 28),
                0x000000,
                0,
              );
              this.physics.add.existing(portalBlock, true);
              this.solidStatics.add(portalBlock);
            }

            const isPortal = tr.kind === 'maia_portal';
            const completed = Boolean(_completionById.current.get(tr.interactable_id));
            const color = completed ? 0x334155 : isPortal ? 0x38bdf8 : 0x22c55e;
            const triggerWidth = isPortal ? Math.max(tr.w * 1.7, 62) : tr.w;
            const triggerHeight = isPortal ? Math.max(tr.h * 0.7, 42) : tr.h;
            const triggerCenterY = tr.y + tr.h / 2;
            const rect = this.add.rectangle(
              tr.x + tr.w / 2, triggerCenterY,
              triggerWidth, triggerHeight, color, isPortal ? 0.03 : 0.22,
            );
            rect.setStrokeStyle(1, color, isPortal ? 0.08 : 0.55);
            this.triggerBodies.push({ rect, meta: tr });
          });

          const hasTraveler = this.textures.exists('lh_traveler_idle_down');
          if (this.textures.exists('lh_maia_portal_idle')) {
            this.anims.create({
              key: 'lh_maia_portal_idle',
              frames: this.anims.generateFrameNumbers('lh_maia_portal_idle', { start: 0, end: 6 }),
              frameRate: 9,
              repeat: -1,
            });
            this.portalSprites.forEach((portal) => portal.play('lh_maia_portal_idle'));
          }
          if (this.textures.exists('lh_maia_portal_activate')) {
            this.anims.create({
              key: 'lh_maia_portal_activate',
              frames: this.anims.generateFrameNumbers('lh_maia_portal_activate', { start: 0, end: 13 }),
              frameRate: 10,
              repeat: 0,
            });
          }
          if (this.textures.exists('lh_maia_portal_deactivate')) {
            this.anims.create({
              key: 'lh_maia_portal_deactivate',
              frames: this.anims.generateFrameNumbers('lh_maia_portal_deactivate', { start: 0, end: 5 }),
              frameRate: 8,
              repeat: 0,
            });
          }

          if (hasTraveler) for (const dir of TRAVELER_DIRECTIONS) {
            this.anims.create({
              key: `lh_traveler_run_${dir}`,
              frames: this.anims.generateFrameNumbers(`lh_traveler_run_${dir}`, {
                frames: [...TRAVELER_VISIBLE_FRAME_INDICES],
              }),
              frameRate: TRAVELER_RUN_ANIM_FPS,
              repeat: -1,
            });
          }

          if (hasTraveler) for (const dir of TRAVELER_DIRECTIONS) {
            const sheetKey = `lh_traveler_attack_${dir}`;
            if (!this.textures.exists(sheetKey)) continue;
            const total = Math.max((this.textures.get(sheetKey)?.frameTotal ?? 0) - 1, 0);
            // Only create if frames exist (frameTotal includes the base frame).
            if (total < 1) continue;
            this.anims.create({
              key: `lh_traveler_attack_${dir}`,
              frames: this.anims.generateFrameNumbers(sheetKey, { start: 0, end: total }),
              frameRate: 14,
              repeat: 0,
            });
          }

          if (!hasTraveler) {
            const g = this.add.graphics();
            g.fillStyle(0xe2e8f0, 1);
            g.fillCircle(12, 12, 12);
            g.generateTexture('lh_player_dot', 24, 24);
            g.destroy();
          }

          const maiaPortal = _triggers.find((tr) => tr.kind === 'maia_portal');
          const spawnX = maiaPortal
            ? Phaser.Math.Clamp(maiaPortal.x + maiaPortal.w / 2, 24, wpx - 24)
            : wpx / 2;
          const spawnY = maiaPortal
            ? Phaser.Math.Clamp(maiaPortal.y + maiaPortal.h + 150, 24, hpx - 24)
            : hpx / 2;

          this.player = this.physics.add.sprite(spawnX, spawnY, hasTraveler ? 'lh_traveler_idle_down' : 'lh_player_dot');
          if (hasTraveler) {
            this.player.setTexture('lh_traveler_idle_down', TRAVELER_VISIBLE_FRAME_INDICES[0]);
            this.player.setScale(0.75);
            this.player.setSize(14, 28);
            this.player.setOffset(9, 46);
          }
          this.player.setCollideWorldBounds(true);
          // Direct velocity each frame — no damping/acceleration inertia (feels grounded).
          this.player.setDamping(false);
          this.player.setDrag(0, 0);
          this.player.setAcceleration(0, 0);
          const maxSpd = Math.max(TRAVELER_MOVE_SPEED_PX, TRAVELER_SPRINT_SPEED_PX) * 1.1;
          this.player.setMaxVelocity(maxSpd, maxSpd);
          this.player.setDepth(50);

          this.physics.add.collider(this.player, this.fogStatics);
          this.physics.add.collider(this.player, this.solidStatics);
          solidLayers.forEach((layer) => {
            this.physics.add.collider(this.player, layer);
          });

          this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
          this.keySpace = this.input.keyboard?.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE,
          ) as Phaser.Input.Keyboard.Key;
          this.keyAttack = this.input.keyboard?.addKey(
            Phaser.Input.Keyboard.KeyCodes.A,
          ) as Phaser.Input.Keyboard.Key;
          this.keySprint = this.input.keyboard?.addKey(
            Phaser.Input.Keyboard.KeyCodes.R,
          ) as Phaser.Input.Keyboard.Key;

          this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
          this.cameras.main.setZoom(1.85);

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
            .text(12, 10, '⬆⬇⬅➡ Move  ·  SPACE Interact  ·  A Attack  ·  R Sprint', {
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
              fontSize: '13px',
              color: '#94a3b8',
            })
            .setScrollFactor(0)
            .setDepth(999)
            .setAlpha(0.92);

          window.addEventListener('lh:maia-handoff-opened', this.handleMaiaOpened);
          window.addEventListener('lh:maia-handoff-closed', this.handleMaiaClosed);
          this.events.once('shutdown', () => {
            window.removeEventListener('lh:maia-handoff-opened', this.handleMaiaOpened);
            window.removeEventListener('lh:maia-handoff-closed', this.handleMaiaClosed);
          });
        }

        private handleMaiaOpened = () => {
          if (import.meta.env.DEV || import.meta.env.VITE_LH_MAIA_DEBUG === 'true') {
            // eslint-disable-next-line no-console
            console.log('[MaiaHandoff Phaser]', 'handleMaiaOpened → pause gameplay');
          }
          this.maiaHandoffPaused = true;
          this.player.setAcceleration(0, 0);
          this.player.setVelocity(0, 0);
        };

        private handleMaiaClosed = () => {
          if (import.meta.env.DEV || import.meta.env.VITE_LH_MAIA_DEBUG === 'true') {
            // eslint-disable-next-line no-console
            console.log('[MaiaHandoff Phaser]', 'handleMaiaClosed → resume gameplay & re-enter');
          }
          this.maiaHandoffPaused = false;
          const portalId = this.lastMaiaPortalId;
          if (!portalId) return;
          const meta = this.triggerBodies.find((row) => row.meta.interactable_id === portalId)?.meta;
          if (!meta) return;

          const portal = this.portalSprites.get(portalId);
          portal?.setAlpha(0.42);
          if (portal && this.anims.exists('lh_maia_portal_deactivate')) {
            portal.play('lh_maia_portal_deactivate');
            portal.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
              portal.setFrame(0);
            });
          } else if (portal) {
            portal.setFrame(0);
          }

          this.portalCooldownUntil.set(portalId, this.time.now + 60000);
          this.time.delayedCall(60000, () => {
            this.portalCooldownUntil.delete(portalId);
            this.activatedInteractableIds.delete(portalId);
            const cooledPortal = this.portalSprites.get(portalId);
            if (!cooledPortal) return;
            cooledPortal.setAlpha(1);
            if (this.anims.exists('lh_maia_portal_idle')) {
              cooledPortal.play('lh_maia_portal_idle');
            }
          });
          this.player.setPosition(meta.x + meta.w / 2, meta.y + meta.h + 24);
          this.player.setAlpha(0);
          this.player.setScale(0.45);
          this.facing = 'down';
          this.player.anims.stop();
          this.player.setTexture('lh_traveler_idle_down', TRAVELER_VISIBLE_FRAME_INDICES[0]);
          this.tweens.add({
            targets: this.player,
            alpha: 1,
            y: meta.y + meta.h + 135,
            scale: 0.75,
            duration: 1700,
            ease: 'Sine.easeOut',
            onComplete: () => {
              this.facing = 'down';
              this.player.anims.stop();
              this.player.setTexture('lh_traveler_idle_down', TRAVELER_VISIBLE_FRAME_INDICES[0]);
            },
          });
        };

        private activateTrigger(hit: TriggerRect) {
          const isPortal = hit.kind === 'maia_portal';
          const isGuildResearchPortal = hit.kind === 'guild_hq_research';
          const completed = Boolean(_completionById.current.get(hit.interactable_id));
          const blockedBySession =
            !isPortal && this.activatedInteractableIds.has(hit.interactable_id);
          if ((!isPortal && completed) || blockedBySession) return;

          if (!isPortal) {
            // Portal-like guild research trigger: short transition + input lock, then open UI.
            if (isGuildResearchPortal) {
              this.activatedInteractableIds.add(hit.interactable_id);
              this.triggerTransitionLocked = true;
              this.player.setAcceleration(0, 0);
              this.player.setVelocity(0, 0);
              this.player.anims.stop();

              const startScale = this.player.scale;
              this.tweens.add({
                targets: this.player,
                alpha: 0,
                y: this.player.y - 14,
                scale: startScale * 0.9,
                duration: 650,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                  _onActivate(hit.interactable_id);
                  // Restore the traveler so closing overlays returns to play.
                  this.tweens.add({
                    targets: this.player,
                    alpha: 1,
                    y: this.player.y + 14,
                    scale: startScale,
                    duration: 420,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                      this.triggerTransitionLocked = false;
                    },
                  });
                },
              });
              return;
            }

            this.activatedInteractableIds.add(hit.interactable_id);
            _onActivate(hit.interactable_id);
            return;
          }

          if (this.portalActivating.has(hit.interactable_id)) return;
          if ((this.portalCooldownUntil.get(hit.interactable_id) ?? 0) > this.time.now) return;
          this.portalActivating.add(hit.interactable_id);
          this.activatedInteractableIds.add(hit.interactable_id);
          this.lastMaiaPortalId = hit.interactable_id;

          this.player.setAcceleration(0, 0);
          this.player.setVelocity(0, 0);
          this.player.anims.stop();
          if (this.textures.exists('lh_traveler_idle_up')) {
            this.player.setTexture('lh_traveler_idle_up', TRAVELER_VISIBLE_FRAME_INDICES[0]);
          }

          const portal = this.portalSprites.get(hit.interactable_id);
          if (portal && this.anims.exists('lh_maia_portal_activate')) {
            portal.play('lh_maia_portal_activate');
            portal.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
              portal.play('lh_maia_portal_idle');
            });
          }

          this.tweens.add({
            targets: this.player,
            alpha: 0,
            // Subtle "step into the mirror" glide (less distance, slower ease).
            y: this.player.y - 18,
            scale: this.player.scale * 0.86,
            duration: 1150,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              // Freeze gameplay while the Maia handoff prompt is visible.
              this.maiaHandoffPaused = true;
              this.player.setAcceleration(0, 0);
              this.player.setVelocity(0, 0);
              _onActivate(hit.interactable_id);
              this.portalActivating.delete(hit.interactable_id);
            },
          });
        }

        update() {
          if (this.maiaHandoffPaused) {
            this.player?.setAcceleration(0, 0);
            this.player?.setVelocity(0, 0);
            return;
          }

          if (this.triggerTransitionLocked) {
            this.player?.setAcceleration(0, 0);
            this.player?.setVelocity(0, 0);
            return;
          }

          if (this.attackingUntil > this.time.now) {
            this.player?.setAcceleration(0, 0);
            this.player?.setVelocity(0, 0);
            return;
          }

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

          let ix = 0;
          let iy = 0;
          if (this.cursors.left?.isDown) ix -= 1;
          if (this.cursors.right?.isDown) ix += 1;
          if (this.cursors.up?.isDown) iy -= 1;
          if (this.cursors.down?.isDown) iy += 1;
          const inputLen = Math.hypot(ix, iy);
          const now = this.time.now;
          const sprintCooldownReady = now >= this.sprintCooldownUntil;
          if (sprintCooldownReady && !this.keySprint.isDown) {
            this.sprintFuelMs = SPRINT_FUEL_MAX_MS;
          }

          let moveSpeed = TRAVELER_MOVE_SPEED_PX;
          let sprintingMove = false;
          if (
            sprintCooldownReady &&
            this.keySprint.isDown &&
            this.sprintFuelMs > 0 &&
            inputLen > 0
          ) {
            moveSpeed = TRAVELER_SPRINT_SPEED_PX;
            sprintingMove = true;
            const dt = Math.min(this.game.loop.delta, 64);
            this.sprintFuelMs -= dt;
            if (this.sprintFuelMs <= 0) {
              this.sprintFuelMs = 0;
              this.sprintCooldownUntil = now + SPRINT_COOLDOWN_MS;
            }
          }

          if (inputLen > 0) {
            ix /= inputLen;
            iy /= inputLen;
            this.player.setVelocity(ix * moveSpeed, iy * moveSpeed);
          } else {
            this.player.setVelocity(0, 0);
          }

          const moving = inputLen > 0;
          if (moving && this.textures.exists(`lh_traveler_run_${this.facing}`)) {
            this.player.anims.timeScale = sprintingMove ? SPRINT_RUN_ANIM_TIME_SCALE : 1;
            // Dominant axis → 4-way facing (clean idle/run transitions).
            if (Math.abs(ix) > Math.abs(iy)) {
              this.facing = ix < 0 ? 'left' : 'right';
            } else if (iy !== 0) {
              this.facing = iy < 0 ? 'up' : 'down';
            }
            const runKey = `lh_traveler_run_${this.facing}`;
            const cur = this.player.anims.currentAnim?.key;
            if (cur !== runKey) {
              this.player.play(runKey);
            } else if (!this.player.anims.isPlaying) {
              this.player.play(runKey);
            }
          } else {
            this.player.anims.timeScale = 1;
            const idleKey = `lh_traveler_idle_${this.facing}`;
            if (this.textures.exists(idleKey)) {
              if (this.player.anims.isPlaying) {
                this.player.anims.stop();
              }
              this.player.setTexture(idleKey, TRAVELER_VISIBLE_FRAME_INDICES[0]);
            }
          }

          if (Phaser.Input.Keyboard.JustDown(this.keyAttack)) {
            // Attack locks movement briefly. If attack sheets exist, play the animation.
            this.player.anims.timeScale = 1;
            this.player.setAcceleration(0, 0);
            this.player.setVelocity(0, 0);
            const atkKey = `lh_traveler_attack_${this.facing}`;
            if (this.anims.exists(atkKey)) {
              this.attackingUntil = this.time.now + 420;
              this.player.play(atkKey, true);
              this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                this.attackingUntil = 0;
              });
            } else {
              // Fallback: tiny lunge + flash so input is testable even before the attack sheet lands.
              this.attackingUntil = this.time.now + 260;
              this.tweens.add({
                targets: this.player,
                alpha: 0.65,
                duration: 90,
                yoyo: true,
                repeat: 1,
              });
            }
            return;
          }

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
              const aDone = Boolean(_completionById.current.get(a.meta.interactable_id));
              const bDone = Boolean(_completionById.current.get(b.meta.interactable_id));
              if (aDone !== bDone) return aDone ? 1 : -1;
              return a.d - b.d;
            });

          const portalHit = overlaps.find((row) => row.meta.kind === 'maia_portal')?.meta;
          const enteringPortalFromBottom = Boolean(
            portalHit &&
              moving &&
              iy < 0 &&
              this.player.y > portalHit.y + portalHit.h * 0.92,
          );
          if (portalHit && enteringPortalFromBottom) {
            this.activateTrigger(portalHit);
            return;
          }

          // Portal-like auto triggers (e.g. Guild HQ research). Defaults come from `activation_mode`.
          const autoHitRow = overlaps.find((row) => {
            const m = row.meta;
            if (m.kind === 'maia_portal') return false;
            const mode = m.activation_mode ?? 'interaction';
            if (mode === 'overlap_auto') return true;
            if (mode === 'overlap_auto_bottom') {
              return Boolean(moving && iy < 0 && this.player.y > m.y + m.h * 0.92);
            }
            return false;
          });
          const autoHit = autoHitRow?.meta;

          // ── Temporary debug output (collision-vs-trigger diagnosis) ──
          // Shows trigger kind, mode, overlap count, and bottom-entry pass/fail.
          if (this.debugText) {
            const top = overlaps[0]?.meta;
            const topMode = top?.activation_mode ?? 'interaction';
            const bottomPass = top
              ? Boolean(moving && iy < 0 && this.player.y > top.y + top.h * 0.92)
              : false;
            this.debugText.setText([
              `player: x=${Math.round(this.player.x)} y=${Math.round(this.player.y)}`,
              `overlaps: ${overlaps.length}`,
              top
                ? `top: ${top.kind} mode=${topMode} rot=${(top.rotation_deg ?? 0).toFixed(3)} bottomPass=${bottomPass}`
                : 'top: (none)',
              top ? `topBounds: x=${top.x.toFixed(1)} y=${top.y.toFixed(1)} w=${top.w.toFixed(1)} h=${top.h.toFixed(1)}` : '',
              autoHit ? `AUTO: ${autoHit.kind} mode=${autoHit.activation_mode ?? 'interaction'}` : 'AUTO: (none)',
            ]);
          }

          if (autoHit) {
            this.activateTrigger(autoHit);
            return;
          }

          if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            const hit = overlaps[0]?.meta;
            const done = hit ? Boolean(_completionById.current.get(hit.interactable_id)) : false;
            if (hit && !done) this.activateTrigger(hit);
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
  }, [realmId]);

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
