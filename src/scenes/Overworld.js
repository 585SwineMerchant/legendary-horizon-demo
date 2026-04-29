import { Enemy } from '../entities/Enemy.js';

export class Overworld extends Phaser.Scene {
    constructor() {
        super('Overworld');
    }

    preload() {
        // Assets are loaded manually in create() from hidden <img> elements
    }

    create() {
        console.log("Overworld: Starting Create (8000x8000)...");
        const W = 8000;
        const H = 8000;

        // =============================================
        // REALM DATA — 17 Guild HQs (positions from LH Map)
        // =============================================
        this.realms = [
            { id: 1,  name: "Aethelwood Farmsteads",      cluster: "Agriculture",             x: 1000, y: 2600, color: 0x84cc16, entryDir: 'right' },
            { id: 2,  name: "Monolith of Masonry",         cluster: "Architecture",            x: 6500, y: 1300, color: 0x94a3b8, entryDir: 'up' },
            { id: 3,  name: "Chronicler's Spire",          cluster: "Arts/AV",                 x: 2300, y: 2300, color: 0xa855f7, entryDir: 'up' },
            { id: 4,  name: "Mercantile's Citadel",        cluster: "Business",                x: 1000, y: 4600, color: 0x3b82f6, entryDir: 'right' },
            { id: 5,  name: "Archives of Ascension",       cluster: "Education",               x: 4000, y: 3300, color: 0x6366f1, entryDir: 'up' },
            { id: 6,  name: "Arcanum Reactor",             cluster: "Energy",                  x: 6600, y: 4000, color: 0xec4899, entryDir: 'left' },
            { id: 7,  name: "The Gilded Vault",            cluster: "Finance",                 x: 2600, y: 4000, color: 0xeab308, entryDir: 'right' },
            { id: 8,  name: "The High Council Hall",       cluster: "Government",              x: 4000, y: 1000, color: 0xef4444, entryDir: 'up' },
            { id: 9,  name: "Aurora Apothecary",           cluster: "Health Science",          x: 6600, y: 6600, color: 0x10b981, entryDir: 'up' },
            { id: 10, name: "The Crossroads Haven",        cluster: "Hospitality",             x: 4000, y: 5300, color: 0xf97316, entryDir: 'down' },
            { id: 11, name: "Empath's Enclave",            cluster: "Human Services",          x: 2600, y: 6600, color: 0xf43f5e, entryDir: 'down' },
            { id: 12, name: "The Etheric Nexus",           cluster: "Information Technology",   x: 7300, y: 5300, color: 0x06b6d4, entryDir: 'left' },
            { id: 13, name: "Valor's Watchtower",          cluster: "Law/Safety",              x: 1300, y: 1000, color: 0x1e293b, entryDir: 'up' },
            { id: 14, name: "The Great Vulcanis Forge",    cluster: "Manufacturing",           x: 7300, y: 2000, color: 0x7c2d12, entryDir: 'up' },
            { id: 15, name: "The Bard's Beacon",           cluster: "Marketing",               x: 6000, y: 5000, color: 0xf59e0b, entryDir: 'right' },
            { id: 16, name: "The Alchemical Observatory",  cluster: "STEM",                    x: 5000, y: 7300, color: 0x8b5cf6, entryDir: 'up' },
            { id: 17, name: "Odyssey's Harbor",            cluster: "Transportation",          x: 6000, y: 7000, color: 0x0ea5e9, entryDir: 'down' }
        ];

        // =============================================
        // TEXTURE LOADING from hidden <img> DOM elements
        // =============================================
        this.textures.addSpriteSheet('hero', document.getElementById('hero-img'), {
            frameWidth: 256, frameHeight: 256
        });
        // buildings uses the original guild_hqs_clean
        this.textures.addSpriteSheet('buildings', document.getElementById('buildings-img'), {
            frameWidth: 256, frameHeight: 256
        });
        this.textures.addSpriteSheet('characters', document.getElementById('chars-img'), {
            frameWidth: 128, frameHeight: 128
        });

        // Tilesets for the Tilemap
        this.textures.addImage('grasssheet', document.getElementById('grasssheet-img'));
        this.textures.addImage('cliffsheet', document.getElementById('cliffsheet-img'));
        this.textures.addImage('watersheet', document.getElementById('watersheet-img'));

        // NEAREST filter on everything for crisp pixel art
        ['hero', 'buildings', 'characters', 'grasssheet', 'cliffsheet', 'watersheet'].forEach(k => {
            try { this.textures.get(k).setFilter(Phaser.Textures.FilterMode.NEAREST); } catch(e) {}
        });

        // =============================================
        // TILEMAP GENERATION
        // =============================================
        // Load the JSON map data into cache
        this.cache.tilemap.add('world_map', { format: Phaser.Tilemaps.Formats.TILED_JSON, data: window.worldMapData });
        const map = this.make.tilemap({ key: 'world_map' });

        // Add tilesets
        const grassTiles = map.addTilesetImage('grasssheet', 'grasssheet');
        const cliffTiles = map.addTilesetImage('cliffsheet', 'cliffsheet');
        const waterTiles = map.addTilesetImage('watersheet', 'watersheet');

        const allTiles = [grassTiles, cliffTiles, waterTiles];

        // Create layers
        const groundLayer = map.createLayer('Ground', allTiles, 0, 0).setDepth(-10);
        const waterLayer = map.createLayer('Water', allTiles, 0, 0).setDepth(-9);
        const mountainLayer = map.createLayer('Mountains', allTiles, 0, 0).setDepth(-8);

        // Set up collision for Water and Mountains
        waterLayer.setCollisionByExclusion([-1, 0]);
        mountainLayer.setCollisionByExclusion([-1, 0]);
        this.obstacles = [waterLayer, mountainLayer];

        // =============================================
        // FOG OF WAR (Temporarily disabled for performance)
        // =============================================
        // this.fog = this.add.renderTexture(0, 0, W, H);
        // this.fog.fill(0x000000, 0.85);
        // this.fog.setDepth(100);

        // this.brush = this.make.graphics({ x: 0, y: 0, add: false });
        // this.brush.fillStyle(0xffffff, 1);
        // this.brush.fillCircle(400, 400, 400);

        // =============================================
        // PLAYER
        // =============================================
        this.player = this.physics.add.sprite(4000, 3500, 'hero');
        this.player.setScale(0.2);
        this.player.body.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // World & Camera Bounds
        this.physics.world.setBounds(0, 0, W, H);
        this.cameras.main.setBounds(0, 0, W, H);
        
        // Add colliders using the array
        this.obstacles.forEach(layer => {
            this.physics.add.collider(this.player, layer);
        });

        // =============================================
        // ANIMATIONS
        // =============================================
        this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers('hero', { start: 0, end: 3 }),
            frameRate: 8, repeat: -1
        });
        this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers('hero', { start: 4, end: 7 }),
            frameRate: 8, repeat: -1
        });
        this.anims.create({
            key: 'walk-horizontal',
            frames: this.anims.generateFrameNumbers('hero', { start: 8, end: 11 }),
            frameRate: 8, repeat: -1
        });
        this.anims.create({
            key: 'slime-idle',
            frames: this.anims.generateFrameNumbers('characters', { start: 0, end: 3 }),
            frameRate: 4, repeat: -1
        });

        // =============================================
        // WAYPOINTS (Realm HQs + Narrative Acts)
        // =============================================
        this.waypoints = this.physics.add.staticGroup();

        this.realms.forEach(realm => this.createRealmWaypoint(realm));

        this.createWaypoint(5500, 5500, 'AWAKENING GLADE', 0x6366f1, 'act1');
        this.createWaypoint(6500, 1500, 'ORACLE OF OPPORTUNITY', 0xf59e0b, 'act2');

        this.physics.add.overlap(this.player, this.waypoints, (player, waypoint) => {
            if (waypoint.actId) {
                window.gameInstance.openEvent(waypoint.actId);
            } else if (waypoint.realmData) {
                this.startEntryAnimation(waypoint);
            }
        });

        // HUD
        this.createHUD();

        // =============================================
        // ENEMIES — spread across the whole map
        // =============================================
        this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
        for (let i = 0; i < 20; i++) {
            this.enemies.get(
                Phaser.Math.Between(500, 7500),
                Phaser.Math.Between(500, 7500)
            );
        }

        // =============================================
        // CAMERA
        // =============================================
        this.cameras.main.startFollow(this.player, true);
        this.cameras.main.setRoundPixels(true);
        this.cursors = this.input.keyboard.createCursorKeys();

        this.add.text(16, 16, 'Use Arrow Keys to Move\nExplore the World of Legendary Horizon', {
            fontFamily: '"Press Start 2P", cursive',
            fontSize: '12px',
            fill: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 10 }
        }).setScrollFactor(0).setDepth(200);

        console.log("Overworld: Create complete.");
    }


    // =============================================
    // HELPER: Realm waypoint with building sprite
    // =============================================
    createRealmWaypoint(data) {
        const clusterMap = {
            "Agriculture": 12, "Architecture": 11, "Arts/AV": 0, "Business": 3,
            "Education": 4, "Energy": 5, "Finance": 6, "Government": 7,
            "Health Science": 13, "Hospitality": 14, "Human Services": 13,
            "Information Technology": 8, "Law/Safety": 11, "Manufacturing": 1,
            "Marketing": 9, "STEM": 2, "Transportation": 10
        };
        const frame = clusterMap[data.cluster] !== undefined ? clusterMap[data.cluster] : 14;

        const waypoint = this.waypoints.create(data.x, data.y, 'buildings', frame)
            .setScale(0.5).setDepth(5);
        waypoint.realmData = data;

        this.add.text(data.x, data.y - 80, data.name, {
            fontFamily: 'Inter', fontSize: '10px',
            fill: '#ffffff', backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(6);
    }

    // =============================================
    // HELPER: Narrative act waypoint (portal effect)
    // =============================================
    createWaypoint(x, y, label, color, actId) {
        const waypoint = this.waypoints.create(x, y, null).setSize(100, 100).setVisible(false);
        waypoint.actId = actId;

        this.add.text(x, y - 60, label, {
            fontFamily: '"Press Start 2P"', fontSize: '12px',
            fill: '#ffffff', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(6);

        const circle = this.add.circle(x, y, 40, color, 0.6).setStrokeStyle(3, 0xffffff);
        this.tweens.add({
            targets: circle, scale: 1.2, alpha: 0.3,
            duration: 1000, yoyo: true, repeat: -1
        });
    }

    // =============================================
    // HELPER: HUD
    // =============================================
    createHUD() {
        const c = this.add.container(16, 50).setScrollFactor(0).setDepth(200);
        const bg = this.add.rectangle(0, 0, 200, 100, 0x000000, 0.7).setOrigin(0);
        bg.setStrokeStyle(2, 0xd97706);

        c.add([
            bg,
            this.add.text(10, 10, 'SCROLL OF DESTINY', {
                fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#f59e0b'
            }),
            this.actText = this.add.text(10, 30, 'ACT: THE AWAKENING', {
                fontFamily: 'Inter', fontSize: '12px', fill: '#ffffff'
            }),
            this.questText = this.add.text(10, 50, 'Objective: Find the Mirror', {
                fontFamily: 'Inter', fontSize: '11px', fill: '#94a3b8'
            }),
            this.statsText = this.add.text(10, 70, 'RIASEC: ???', {
                fontFamily: 'Inter', fontSize: '11px', fill: '#d97706'
            })
        ]);
    }

    // =============================================
    // UPDATE LOOP
    // =============================================
    update() {
        if (this.isEntering) return;

        const speed = 250;
        this.player.body.setVelocity(0);
        let moving = false;

        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-speed);
            this.player.play('walk-horizontal', true);
            this.player.setFlipX(true);
            moving = true;
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(speed);
            this.player.play('walk-horizontal', true);
            this.player.setFlipX(false);
            moving = true;
        }

        if (this.cursors.up.isDown) {
            this.player.body.setVelocityY(-speed);
            if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
                this.player.play('walk-up', true);
            }
            moving = true;
        } else if (this.cursors.down.isDown) {
            this.player.body.setVelocityY(speed);
            if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
                this.player.play('walk-down', true);
            }
            moving = true;
        }

        if (!moving) this.player.stop();
        if (moving) this.player.body.velocity.normalize().scale(speed);

        // Clear fog around player
        // if (this.fog) this.fog.erase(this.brush, this.player.x - 400, this.player.y - 400);
    }

    // =============================================
    // ENTRY ANIMATION (walk-into-building effect)
    // =============================================
    startEntryAnimation(waypoint) {
        if (this.isEntering) return;
        this.isEntering = true;

        const data = waypoint.realmData;
        const player = this.player;
        player.body.setVelocity(0);

        let targetX = player.x, targetY = player.y;
        let anim = 'walk-up';

        if (data.entryDir === 'up')    { targetY -= 100; anim = 'walk-up'; }
        if (data.entryDir === 'down')  { targetY += 100; anim = 'walk-down'; }
        if (data.entryDir === 'left')  { targetX -= 100; anim = 'walk-horizontal'; player.setFlipX(true); }
        if (data.entryDir === 'right') { targetX += 100; anim = 'walk-horizontal'; player.setFlipX(false); }

        player.play(anim, true);

        this.tweens.add({
            targets: player, x: targetX, y: targetY, alpha: 0, duration: 1000,
            onComplete: () => {
                window.gameInstance.openRealm(data);
                this.time.delayedCall(500, () => {
                    this.isEntering = false;
                    player.setAlpha(1);
                    if (data.entryDir === 'up')    player.y += 150;
                    if (data.entryDir === 'down')  player.y -= 150;
                    if (data.entryDir === 'left')  player.x += 150;
                    if (data.entryDir === 'right') player.x -= 150;
                });
            }
        });
    }
}
