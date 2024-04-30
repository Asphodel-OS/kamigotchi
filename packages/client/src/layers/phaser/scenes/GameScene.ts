import Phaser from 'phaser';

import { Room } from 'constants/rooms';
import { checkDuplicateRooms } from '../utils/rooms';

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
    // this.load.image('wallpaper', backgrounds.kamiPatternWide);

    if (this.room) {
      const room = this.room;
      // if (room.background) this.load.image(room.background.key, room.background.path);
      // if (room.objects) room.objects.map((obj) => this.load.image(obj.key, obj.path));
      if (room.music) this.load.audio(room.music.key, room.music.path);
    }
  }

  create() {
    if (this.room) {
      const room = this.room;

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
