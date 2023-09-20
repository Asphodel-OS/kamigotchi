import { dataStore } from 'layers/react/store/createStore';
import { playClick } from 'utils/sounds';

export const triggerPetMintModal = () => {
  const { visibleModals } = dataStore.getState();
  playClick();

  if (!visibleModals.kamiMint) {
    dataStore.setState({
      visibleModals: {
        ...visibleModals,
        kamiMint: true,
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        kami: false,
        emaBoard: false,
        map: false,
        nameKami: false,
        node: false,
      },
    });
  } else {
    dataStore.setState({ visibleModals: { ...visibleModals, kamiMint: false } });
  }
};
