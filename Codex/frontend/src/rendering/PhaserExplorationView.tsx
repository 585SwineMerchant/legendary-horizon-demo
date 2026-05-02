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

/**
 * Minimal Phaser bridge (v4): replaces percent-positioned buttons with a mover + overlap-based interaction.
 * The current Tiled demo export is object-layers only, so we render trigger/fog rectangles rather than tile graphics.
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
    const host = hostRef.current;
    if (!host) return;

    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    const width = Math.max(host.clientWidth, 640);
    const height = Math.max(host.clientHeight, 420);

    class LhScene extends Phaser.Scene {
      private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      private keySpace!: Phaser.Input.Keyboard.Key;
      private player!: Phaser.Physics.Arcade.Sprite;
      private fogStatics!: Phaser.Physics.Arcade.StaticGroup;
      private triggerBodies: Array<{ rect: Phaser.GameObjects.Rectangle; meta: TriggerRect }> = [];

      create() {
        const wpx = parsedMap.footprint.width_px || 960;
        const hpx = parsedMap.footprint.height_px || 640;

        this.cameras.main.setBackgroundColor(0x0b1220);
        this.physics.world.setBounds(0, 0, wpx, hpx);
        this.cameras.main.setBounds(0, 0, wpx, hpx);

        // Fog regions become collision “walls” in this minimal pass.
        this.fogStatics = this.physics.add.staticGroup();
        parsedMap.fog_regions.forEach((f) => {
          const b = f.bounds;
          const r = this.add.rectangle(b.x + b.width / 2, b.y + b.height / 2, b.width, b.height, 0x111827, 0.7);
          this.physics.add.existing(r, true);
          this.fogStatics.add(r);
        });

        // Trigger zones (non-colliding).
        triggers.forEach((tr) => {
          const color = tr.completed ? 0x334155 : 0x22c55e;
          const rect = this.add.rectangle(tr.x + tr.w / 2, tr.y + tr.h / 2, tr.w, tr.h, color, 0.22);
          rect.setStrokeStyle(1, color, 0.55);
          this.triggerBodies.push({ rect, meta: tr });
        });

        // Player sprite (simple circle).
        const g = this.add.graphics();
        g.fillStyle(0xe2e8f0, 1);
        g.fillCircle(10, 10, 10);
        g.generateTexture('lh_player_dot', 20, 20);
        g.destroy();

        this.player = this.physics.add.sprite(96, 96, 'lh_player_dot');
        this.player.setCollideWorldBounds(true);
        this.player.setDamping(true);
        this.player.setDrag(600, 600);
        this.player.setMaxVelocity(220, 220);

        this.physics.add.collider(this.player, this.fogStatics);

        this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
        this.keySpace = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE) as Phaser.Input.Keyboard.Key;

        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
        this.cameras.main.setZoom(1);

        const hint = this.add
          .text(12, 10, 'Phaser renderer (WIP): arrows to move · Space to interact', {
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
            fontSize: '12px',
            color: '#94a3b8',
          })
          .setScrollFactor(0)
          .setDepth(999);
        hint.setAlpha(0.95);
      }

      update() {
        const accel = 520;
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        let ax = 0;
        let ay = 0;
        if (this.cursors.left?.isDown) ax -= accel;
        if (this.cursors.right?.isDown) ax += accel;
        if (this.cursors.up?.isDown) ay -= accel;
        if (this.cursors.down?.isDown) ay += accel;
        this.player.setAcceleration(ax, ay);

        if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
          // Interact with first incomplete trigger we overlap; otherwise nearest overlapping.
          const px = this.player.x;
          const py = this.player.y;
          const overlaps = this.triggerBodies
            .filter(({ rect }) => Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), rect.getBounds()))
            .map((row) => ({
              ...row,
              d: (row.rect.x - px) * (row.rect.x - px) + (row.rect.y - py) * (row.rect.y - py),
            }))
            .sort((a, b) => {
              if (a.meta.completed !== b.meta.completed) return a.meta.completed ? 1 : -1;
              return a.d - b.d;
            });

          const hit = overlaps[0]?.meta;
          if (hit && !hit.completed) {
            onActivateHotspot(hit.interactable_id);
          }
        }
      }
    }

    const cfg: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
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

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [onActivateHotspot, parsedMap.fog_regions, parsedMap.footprint.height_px, parsedMap.footprint.width_px, realmId, triggers]);

  return <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} aria-label="Phaser exploration renderer" />;
}

