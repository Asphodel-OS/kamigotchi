import { Room } from 'constants/phaser/rooms';
import { checkDuplicateRooms } from '../utils/checkDuplicateRooms';
import { useSoundSettings } from 'layers/react/store/soundSettings';
import { kamiPattern } from 'assets/images/backgrounds';
import { triggerDialogueModal } from '../utils/triggerDialogueModal';

// an additional field for the Phaser Scene for the GameScene
// this allows us to set shaped data we can reliably pull
export interface GameScene {
  room: Room;
}

// the main game scene of Kamigotchi. this controls the rendering of assets
// and the playback of sound in each room
export class GameScene extends Phaser.Scene implements GameScene {
  // TODO: use WebAudioSound which has the setVolume function
  private gameSound: Phaser.Sound.HTML5AudioSound | undefined;
  private currentVolume: number;
  public prevRoom: number;
  public currentRoom: number;

  constructor() {
    super('Game');
    this.currentVolume = 0.5;
    this.prevRoom = 0;
    this.currentRoom = 0;
  }

  preload() {
    if (this.room) {
      const room = this.room;
      this.load.image('wallpaper', kamiPattern);
      if (room.background) this.load.image(room.background.key, room.background.path);
      if (room.objects) room.objects.map((obj) => this.load.image(obj.key, obj.path));
      if (room.music) this.load.audio(room.music.key, room.music.path);
    }
  }

  create() {
    const { width: gameWidth, height: gameHeight } = this.sys.game.canvas;
    this.game.scene.scenes[0].sound.pauseOnBlur = false;
    if (this.room) {
      const room = this.room;
      let scale = 1; // scale of image assets

      // set the wallpaper behind the game
      let wallpaper = this.add.image(gameWidth / 2, gameHeight / 2, 'wallpaper');
      scale = (1 * gameHeight) / wallpaper.height;
      wallpaper.setScale(scale);

      // set the room image
      if (room.background) {
        let bg = this.add.image(gameWidth / 2, gameHeight / 2, room.background.key);
        scale = (1 * gameHeight) / bg.height;
        bg.setScale(scale);
      }

      // generate all in-room visual assets
      if (room.objects) {
        room.objects.map((obj) => {
          const { key, offset, onClick, dialogue } = obj;
          let posX: number = gameWidth / 2;
          let posY: number = gameHeight / 2;

          if (offset) {
            posX += offset.x * scale;
            posY += offset.y * scale;
          }

          let image = this.add.image(posX, posY, key);
          image.setScale(scale);
          image.setInteractive({ useHandCursor: true });

          // TODO: remove this once room objects are cleaned up
          if (onClick) {
            image.on('pointerdown', (e: Phaser.Input.Pointer) => onClick());
          }
          if (dialogue) {
            image.on('pointerdown', () => triggerDialogueModal(dialogue));
          }
        });
      }

      if (this.room.music) {
        const { volumeMusic } = useSoundSettings.getState();
        this.currentVolume = volumeMusic;
        if (!checkDuplicateRooms(this.currentRoom, this.prevRoom)) {
          const bgm = this.sound.add(
            this.room.music.key,
            { volume: volumeMusic, loop: true }
          ) as Phaser.Sound.HTML5AudioSound;

          bgm.setLoop(true);
          bgm.play();
          this.gameSound = bgm;
        }
      }
    }

    this.prevRoom = this.currentRoom;

    // subscribe to sound settings store to adjust BGM volume
    useSoundSettings.subscribe(() => {
      const { volumeMusic } = useSoundSettings.getState();
      if (this.gameSound && volumeMusic !== this.currentVolume) {
        this.currentVolume = volumeMusic;
        this.gameSound.setVolume(volumeMusic);
      }
      this.update();
    });
  }

  update() { }

  onClick() {
    console.log('clicked');
  }
}
