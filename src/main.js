import { Overworld } from './scenes/Overworld.js';

const config = {
    type: Phaser.CANVAS,
    parent: 'game-container',
    width: 800,
    height: 600,
    pixelArt: true,
    roundPixels: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [Overworld],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);

// Global reference for the UI to talk back to the game
window.gameInstance = {
    openEvent: (actId) => {
        document.body.classList.add('modal-active');
        const container = document.getElementById('app-container');
        const content = document.getElementById('app-content');
        container.classList.add('active');
        
        let file = '';
        if (actId === 'act1') file = 'Current Scroll of Destiny.html';
        if (actId === 'act2') file = 'Quest_of_Fate.html';
        if (actId === 'act3') file = 'Fog of the unknown.html';

        content.innerHTML = `<iframe id="app-iframe" src="${file}"></iframe>`;
        
        // Pause the game scene
        game.scene.getScene('Overworld').scene.pause();
    },
    closeEvent: () => {
        document.body.classList.remove('modal-active');
        document.getElementById('app-container').classList.remove('active');
        document.getElementById('app-content').innerHTML = '';
        
        // Resume the game scene
        game.scene.getScene('Overworld').scene.resume();
    }
};

export default game;
