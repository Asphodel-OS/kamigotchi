import { dataStore } from 'layers/react/store/createStore';
import clickSound from 'assets/sound/fx/mouseclick.wav';

export const triggerPetMintModal = () => {
  const {
    visibleModals,
    sound: { volume },
  } = dataStore.getState();

  const clickFX = new Audio(clickSound);
  clickFX.volume = volume;
  clickFX.play();

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
