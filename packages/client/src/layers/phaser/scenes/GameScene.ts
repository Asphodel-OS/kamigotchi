import { Room } from 'src/constants';

// an additional field for the Phaser Scene for the GameScene
// this allows us to set shaped data we can reliably pull
export interface GameScene {
  room: Room;
}


// the main game scene of Kamigotchi. this controls the rendering of assets
// and the playback of sound in each room
export class GameScene extends Phaser.Scene implements GameScene {
  constructor() {
    super('Game');
  }

  preload() {
    if (this.room) {
      const room = this.room;
      // console.log('preload: room', room);
      if (room.background) this.load.image(room.background.key, room.background.path);
      if (room.objects) room.objects.map((obj) => this.load.image(obj.key, obj.path));
      if (room.music) this.load.audio(room.music.key, room.music.path);
    }
  }

  create() {
    const { width: gameWidth, height: gameHeight } = this.sys.game.canvas;
    if (this.room) {
      const room = this.room;
      let scale = 1; // scale of image assets

      // set the background image
      if (room.background) {
        let bg = this.add.image(
          gameWidth / 2,
          gameHeight / 2,
          room.background.key
        );
        scale = .8 * gameHeight / bg.height;
        bg.setScale(scale);
      }


      // generate all in-room visual assets
      if (room.objects) {
        room.objects.map((obj) => {
          const { key, offset, onClick } = obj;
          let posX: number = gameWidth / 2;
          let posY: number = gameHeight / 2;

          if (offset) {
            posX += offset.x * scale;
            posY += offset.y * scale;
          }

          let image = this.add.image(posX, posY, key);
          image.setScale(scale);

          if (onClick) {
            image.setInteractive();
            image.on('pointerdown', onClick);
          }
        });
      }

      // run the music
      // TODO: update this config somehow to pull settings from the Store
      if (this.room.music) {
        this.sound.add(
          this.room.music.key,
          { volume: 0.5, loop: true }
        ).play();
      }
    }
  }

  update() { }

  onClick() {
    console.log('clicked');
  }
}
