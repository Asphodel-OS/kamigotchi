import { dataStore } from 'layers/react/store/createStore';
import { playClick } from 'utils/sounds';

export const triggerERC20BridgeModal = () => {
  const { visibleModals } = dataStore.getState();
  playClick();

  if (!visibleModals.bridgeERC20) {
    dataStore.setState({
      visibleModals: {
        ...visibleModals,
        bridgeERC20: true,
        bridgeERC721: false,
        dialogue: false,
        kami: false,
        emaBoard: false,
        map: false,
        nameKami: false,
        node: false,
        leaderboard: false,
      },
    });
  } else {
    dataStore.setState({ visibleModals: { ...visibleModals, bridgeERC20: false } });
  }
};
