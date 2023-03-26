import { dataStore } from 'layers/react/store/createStore';
import dialogueSound from 'assets/sound/fx/speech3.mp3';

export const triggerDialogueModal = (
  object: Phaser.GameObjects.GameObject,
  description: string
) => {
  return object.setInteractive().on('pointerdown', () => {
    const clickFX = new Audio(dialogueSound);

    const {
      visibleModals,
      sound: { volume },
    } = dataStore.getState();

    clickFX.volume = volume;
    clickFX.play();

    dataStore.setState({ dialogue: { description } });
    dataStore.setState({
      visibleModals: { ...visibleModals, dialogue: !visibleModals.dialogue },
    });
  });
};
