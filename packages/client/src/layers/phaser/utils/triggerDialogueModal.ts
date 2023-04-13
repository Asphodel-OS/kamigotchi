import { dataStore } from 'layers/react/store/createStore';
import dialogueSound from 'assets/sound/fx/mouseclick.wav';

export const triggerDialogueModal = (description) => {

  const {
    visibleModals,
    sound: { volume },
  } = dataStore.getState();

  const clickFX = new Audio(dialogueSound);

  clickFX.volume = volume;
  clickFX.play();

  dataStore.setState({ dialogue: { description } });
  dataStore.setState({
    visibleModals: { ...visibleModals, dialogue: true },
  });
}
