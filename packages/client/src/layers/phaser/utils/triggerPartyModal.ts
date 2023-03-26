import { dataStore } from 'layers/react/store/createStore';

export const triggerPartyModal = (object: Phaser.GameObjects.GameObject) => {
  return object.setInteractive().on('pointerdown', () => {
    const { visibleModals } = dataStore.getState();

    dataStore.setState({
      visibleModals: { ...visibleModals, party: !visibleModals.party },
    });
  });
};
