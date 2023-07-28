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
  if (!visibleModals.dialogue) {
    dataStore.setState({
      visibleModals: {
        ...visibleModals,
        dialogue: true,
        bridgeERC721: false,
        bridgeERC20: false,
        kami: false,
        kamisNaming: false,
        map: false,
        nameKami: false,
        node: false,
        party: false,
        leaderboard: false,
      },
    });
  } else {
    dataStore.setState({ visibleModals: { ...visibleModals, bridgeERC721: false } });
  }
};
