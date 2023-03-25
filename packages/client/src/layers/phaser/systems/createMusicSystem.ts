import { defineSystem, Has, HasValue, runQuery } from "@latticexyz/recs";
import { NetworkLayer } from "../../network/types";
import { dataStore } from "layers/react/store/createStore";
import { PhaserLayer, PhaserScene } from "../types";
import { getCurrentRoom } from "../utils";

export function createMusicSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { Location, OperatorAddress },
    network: { connectedAddress }
  } = network;

  const {
    game: {
      scene: {
        keys: { Main },
      },
    },
  }: { game: Phaser.Game } = phaser;

  const myMain = Main as PhaserScene;

  defineSystem(world, [Has(OperatorAddress), Has(Location)], (update) => {
    const gNFTIDalt = Array.from(
      runQuery([HasValue(OperatorAddress, { value: connectedAddress.get() })])
    )[0];
    const currentRoom = getCurrentRoom(Location, update.entity);

    if (update.entity == gNFTIDalt) {
      if (myMain.gmusic) myMain.gmusic.stop();

      myMain.gmusic = myMain.sound.add(`m_${currentRoom}`);

      const {
        sound: { volume },
      } = dataStore.getState();

      myMain.gmusic.volume = volume;
      myMain.gmusic.loop = true;
      myMain.gmusic.play();
    }
  });
}
