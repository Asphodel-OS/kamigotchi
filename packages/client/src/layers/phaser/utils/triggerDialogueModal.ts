import { dataStore } from 'layers/react/store/createStore';
import { playClick } from 'utils/sounds';

export const triggerDialogueModal = (description: string[]) => {
  const { visibleModals } = dataStore.getState();
  playClick();

  dataStore.setState({ dialogue: { description } });
  if (!visibleModals.dialogue) {
    dataStore.setState({
      visibleModals: {
        ...visibleModals,
        dialogue: true,
        bridgeERC721: false,
        bridgeERC20: false,
        kami: false,
        emaBoard: false,
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
