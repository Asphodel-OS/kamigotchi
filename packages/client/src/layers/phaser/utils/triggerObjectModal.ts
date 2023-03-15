import { dataStore } from '../../react/store/createStore';
import dialogueSound from '../../../public/sound/sound_effects/speech3.mp3';

export const triggerObjectModal = (
  object: Phaser.GameObjects.GameObject,
  description: string
) => {
  return object.setInteractive().on('pointerdown', () => {
    const clickFX = new Audio(dialogueSound);

    const {
      visibleDivs,
      sound: { volume },
    } = dataStore.getState();

    clickFX.volume = volume;
    clickFX.play();

    dataStore.setState({ objectData: { description } });
    dataStore.setState({
      visibleDivs: { ...visibleDivs, objectModal: !visibleDivs.objectModal },
    });
  });
};
