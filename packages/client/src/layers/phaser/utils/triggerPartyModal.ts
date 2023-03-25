import { dataStore } from 'layers/react/store/createStore';

export const triggerPartyModal = (object: Phaser.GameObjects.GameObject) => {
  return object.setInteractive().on('pointerdown', () => {
    const { visibleDivs } = dataStore.getState();

    dataStore.setState({
      visibleDivs: { ...visibleDivs, party: !visibleDivs.party },
    });
  });
};
