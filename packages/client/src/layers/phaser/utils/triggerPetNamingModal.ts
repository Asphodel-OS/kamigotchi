import { dataStore } from 'layers/react/store/createStore';
import { playClick } from 'utils/sounds';

export const triggerPetNamingModal = () => {
  const { visibleModals } = dataStore.getState();
  playClick();

  if (!visibleModals.emaBoard) {
    dataStore.setState({
      visibleModals: {
        ...visibleModals,
        emaBoard: true,
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        kami: false,
        kamiMint: false,
        map: false,
        nameKami: false,
        node: false,
      },
    });
  } else {
    dataStore.setState({ visibleModals: { ...visibleModals, emaBoard: false } });
  }
};
