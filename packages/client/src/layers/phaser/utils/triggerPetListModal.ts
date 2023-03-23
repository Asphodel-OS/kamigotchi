import { dataStore } from '../../react/store/createStore';

export const triggerPetListModal = (object: Phaser.GameObjects.GameObject) => {
  return object.setInteractive().on('pointerdown', () => {
    const { visibleDivs } = dataStore.getState();

    dataStore.setState({
      visibleDivs: { ...visibleDivs, petList: !visibleDivs.petList },
    });
  });
};
