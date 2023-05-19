import { dataStore } from 'layers/react/store/createStore';
import clickSound from 'assets/sound/fx/mouseclick.wav';

export const triggerDialogueModal = (description: string[]) => {
  const {
    visibleModals,
    sound: { volume },
  } = dataStore.getState();

  const clickFX = new Audio(clickSound);

  clickFX.volume = volume;
  clickFX.play();

  dataStore.setState({ dialogue: { description } });
  dataStore.setState({
    visibleModals: { ...visibleModals, dialogue: true, party: false, node: false, map: false },
  });
};
