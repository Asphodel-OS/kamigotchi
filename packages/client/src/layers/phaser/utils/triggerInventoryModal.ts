import { dataStore } from 'layers/react/store/createStore';

export const triggerInventoryModal = (
  object: Phaser.GameObjects.GameObject
) => {
  return object.setInteractive().on('pointerdown', () => {
    const { visibleModals } = dataStore.getState();

    dataStore.setState({
      visibleModals: { ...visibleModals, inventory: !visibleModals.inventory },
    });
  });
};
