import { dataStore } from 'layers/react/store/createStore';
import { playClick } from 'utils/sounds';

export const triggerERC721BridgeModal = () => {
  const { visibleModals } = dataStore.getState();

  if (!visibleModals.bridgeERC721 && !visibleModals.node) {
    playClick();
    dataStore.setState({
      visibleModals: {
        ...visibleModals,
        bridgeERC721: true,
        bridgeERC20: false,
        dialogue: false,
        kami: false,
        emaBoard: false,
        map: false,
        nameKami: false,
        node: false,
        leaderboard: false,
      },
    });
  }
  // else {
  //   dataStore.setState({ visibleModals: { ...visibleModals, bridgeERC721: false } });
  // }
};
