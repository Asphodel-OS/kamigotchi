import { dataStore } from 'layers/react/store/createStore';

export const triggerPetMintModal = (object: Phaser.GameObjects.GameObject) => {
  return object.setInteractive().on('pointerdown', () => {
    const { visibleModals } = dataStore.getState();

    dataStore.setState({
      visibleModals: { ...visibleModals, kamiMint: !visibleModals.kamiMint },
    });
  });
};
