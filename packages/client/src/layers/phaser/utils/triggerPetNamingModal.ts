import { dataStore } from 'layers/react/store/createStore';
import clickSound from 'assets/sound/fx/mouseclick.wav';

export const triggerPetNamingModal = () => {
  const {
    visibleModals,
    sound: { volume },
  } = dataStore.getState();

  const clickFX = new Audio(clickSound);
  clickFX.volume = volume;
  clickFX.play();

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
