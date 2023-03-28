/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { defineScene } from '@latticexyz/phaserx';

import {
  room001,
  room002,
  room003,
  room004,
  room005,
  room006,
  room007,
  room008,
  room009,
  room010,
  room011,
  room012,
  room013,
  room014,
} from '../rooms/';
import { PhaserScene, Room } from '../types';

import room1Music from 'assets/sound/ost/1_Misty_Riverside.mp3';
import room2Music from 'assets/sound/ost/2_Tunnel_of_Trees.mp3';
import room3Music from 'assets/sound/ost/3_Torii_Gate.mp3';
import room4Music from 'assets/sound/ost/4_Vending_Machine.mp3';
import room5Music from 'assets/sound/ost/5_Dump_Edge_Restricted_Area.mp3';
import room6Music from 'assets/sound/ost/6_Asphodel_Entrance.mp3';
import room7Music from 'assets/sound/ost/7_Lobby.mp3';
import room8Music from 'assets/sound/ost/8_Junk_Shop.mp3';
import room9Music from 'assets/sound/ost/9_Forest_Old_Growth.mp3';
import room10Music from 'assets/sound/ost/10_Forest_Insect_Node.mp3';
import room11Music from 'assets/sound/ost/11_Waterfall_Temple.mp3';
import room12Music from 'assets/sound/ost/12_Dump_Machine_Node.mp3';
import room13Music from 'assets/sound/ost/13_Hidden_Room_Convenience_Store.mp3';
import room14Music from 'assets/sound/ost/14_Hidden_Room.mp3';

export function defineMainScene() {
  return {
    ['Main']: defineScene({
      key: 'Main',
      preload: (scene: PhaserScene) => {
        scene.rooms = [
          room001(),
          room001(),
          room002(),
          room003(),
          room004(),
          room005(),
          room006(),
          room007(),
          room008(),
          room009(),
          room010(),
          room011(),
          room012(),
          room013(),
          room014(),
        ];

        scene.interactiveObjects = [];

        scene.load.audio('m_1', room1Music);
        scene.load.audio('m_2', room2Music);
        scene.load.audio('m_3', room3Music);
        scene.load.audio('m_4', room4Music);
        scene.load.audio('m_5', room5Music);
        scene.load.audio('m_6', room6Music);
        scene.load.audio('m_7', room7Music);
        scene.load.audio('m_8', room8Music);
        scene.load.audio('m_9', room9Music);
        scene.load.audio('m_10', room10Music);
        scene.load.audio('m_11', room11Music);
        scene.load.audio('m_12', room12Music);
        scene.load.audio('m_13', room13Music);
        scene.load.audio('m_14', room14Music);

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
