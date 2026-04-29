export class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'characters', 32);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.play('slime-idle');
        this.setScale(0.5);
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(1);
        
        // Random move timer
        this.moveTimer = scene.time.addEvent({
            delay: 2000,
            callback: this.changeDirection,
            callbackScope: this,
            loop: true
        });
        
        this.changeDirection();
    }

    changeDirection() {
        const speed = 100;
        const dir = Phaser.Math.Between(0, 3);
        switch(dir) {
            case 0: this.setVelocity(speed, 0); break;
            case 1: this.setVelocity(-speed, 0); break;
            case 2: this.setVelocity(0, speed); break;
            case 3: this.setVelocity(0, -speed); break;
        }
    }

    update() {
        // Simple update logic
    }
}
