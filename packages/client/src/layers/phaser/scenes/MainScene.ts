/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { defineScene } from '@latticexyz/phaserx';
import { room001, room002, room003, room004 } from '../rooms/';
import { PhaserScene, Room } from '../types';

import room1Music from 'assets/sound/music/atmospheric.mp3';
import room2Music from 'assets/sound/music/landfill2.mp3';
import room3Music from 'assets/sound/music/corridor.mp3';
import room4Music from 'assets/sound/music/shopkeep_song.mp3';

export function defineMainScene() {
  return {
    ['Main']: defineScene({
      key: 'Main',
      preload: (scene: PhaserScene) => {
        scene.rooms = [room001(), room001(), room002(), room003(), room004()];

        scene.interactiveObjects = [];

        scene.load.audio('m_1', room1Music);
        scene.load.audio('m_2', room2Music);
        scene.load.audio('m_3', room3Music);
        scene.load.audio('m_4', room4Music);

        scene.rooms?.forEach((room: Room) => {
          if (room == undefined) return;
          if (room.preload) room.preload!(scene);
        });
      },
      create: (scene: PhaserScene) => {
        scene.sound.pauseOnBlur = false;

        scene.rooms![1].create(scene);
      },
    }),
  };
}
