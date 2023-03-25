import { dataStore } from 'layers/react/store/createStore';

export const triggerPetMintModal = (object: Phaser.GameObjects.GameObject) => {
  return object.setInteractive().on('pointerdown', () => {
    const { visibleDivs } = dataStore.getState();

    dataStore.setState({
      visibleDivs: { ...visibleDivs, petMint: !visibleDivs.petMint },
    });
  });
};
