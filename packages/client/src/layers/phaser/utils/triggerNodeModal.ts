import { dataStore } from 'layers/react/store/createStore';
import { playClick } from 'utils/sounds';

export const triggerNodeModal = () => {
  const { visibleModals } = dataStore.getState();
  playClick();

  if (!visibleModals.node) {
    dataStore.setState({
      visibleModals: {
        ...visibleModals,
        node: true,
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        kami: false,
        kamiMint: false,
        emaBoard: false,
        map: false,
        nameKami: false,
      },
    });
  } else {
    dataStore.setState({ visibleModals: { ...visibleModals, node: false } });
  }
};
