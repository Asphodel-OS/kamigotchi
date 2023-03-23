import { dataStore } from '../../react/store/createStore';

export const triggerInventoryModal = (
  object: Phaser.GameObjects.GameObject
) => {
  return object.setInteractive().on('pointerdown', () => {
    const { visibleDivs } = dataStore.getState();

    dataStore.setState({
      visibleDivs: { ...visibleDivs, inventory: !visibleDivs.inventory },
    });
  });
};
