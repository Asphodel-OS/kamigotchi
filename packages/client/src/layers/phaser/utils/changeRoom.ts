import { EntityID } from "@latticexyz/recs";

export const changeRoom = (object: Phaser.GameObjects.Image, to: number) => {
  const {
    network: {
      network,
      api: { player: { account: { move } } },
      world,
      actions,
    },
  } = window.layers!;

  return object.setInteractive().on("pointerdown", () => {

    const actionID = `Moving` as EntityID;

    actions.add({
      id: actionID,
      components: {},
      requirement: () => true,
      updates: () => [],
      execute: async () => {
        return move(to);
      },
    });
  })
}
