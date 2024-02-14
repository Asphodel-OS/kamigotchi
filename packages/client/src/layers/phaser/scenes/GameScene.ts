import { backgrounds } from 'assets/images/backgrounds';
import { Room } from 'constants/rooms';
import Phaser from 'phaser';
import { checkModalCoverage } from '../utils/checkModalCoverage';
import { checkDuplicateRooms } from '../utils/rooms';
import { triggerDialogueModal } from '../utils/triggers/triggerDialogueModal';

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
    this.load.image('wallpaper', backgrounds.kamiPatternWide);

    if (this.room) {
      const room = this.room;
      if (room.background) this.load.image(room.background.key, room.background.path);
      if (room.objects) room.objects.map((obj) => this.load.image(obj.key, obj.path));
      if (room.music) this.load.audio(room.music.key, room.music.path);
    }
  }

  create() {
    const { width: gameWidth, height: gameHeight } = this.sys.game.canvas;
    this.game.scene.scenes[0].sound.pauseOnBlur = false;

    // set the wallpaper behind the game
    let wallpaper = this.add.image(gameWidth / 2, gameHeight / 2, 'wallpaper');
    let wpHeightScale = (1 * gameHeight) / wallpaper.height;
    let wpWidthScale = (1 * gameWidth) / wallpaper.width;
    wallpaper.setScale(Math.max(wpHeightScale, wpWidthScale));

    if (this.room) {
      const room = this.room;
      let scale = 1; // scale of image assets

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
            image.on('pointerdown', (e: Phaser.Input.Pointer) => {
              if (!checkModalCoverage(e)) onClick();
            });
          } else if (dialogue) {
            image.on('pointerdown', (e: Phaser.Input.Pointer) => {
              if (!checkModalCoverage(e)) triggerDialogueModal(dialogue);
            });
          }
        });
      }

      if (room.music) {
        const settings = JSON.parse(localStorage.getItem('settings') ?? '{}');
        const volume = settings.volume.bgm ?? 0.5;
        this.currentVolume = volume;
        if (!checkDuplicateRooms(this.currentRoom, this.prevRoom)) {
          const bgm = this.sound.add(room.music.key, {
            volume,
          }) as Phaser.Sound.HTML5AudioSound;
          bgm.loop = true;
          bgm.play();
          this.gameSound = bgm;
        }
      }
    }

    this.prevRoom = this.currentRoom;

    // update the bgm volume based on settings found in localstorage
    // NOTE: we rely on the event dispatched from usehooks-ts here and can't populate custom keys
    window.addEventListener('local-storage', () => {
      const settings = JSON.parse(localStorage.getItem('settings') ?? '{}');
      const volume = settings.volume.bgm ?? 0.5;
      if (this.gameSound) {
        this.gameSound.setVolume(volume);
      }
    });
  }

  update() {}
}
