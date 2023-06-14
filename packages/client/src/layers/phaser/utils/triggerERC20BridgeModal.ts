import { dataStore } from 'layers/react/store/createStore';
import clickSound from 'assets/sound/fx/mouseclick.wav';

export const triggerERC20BridgeModal = () => {
  const {
    visibleModals,
    sound: { volume },
  } = dataStore.getState();
  const clickFX = new Audio(clickSound);

  clickFX.volume = volume;
  clickFX.play();

  if (!visibleModals.bridgeERC20) {
    dataStore.setState({
      visibleModals: {
        ...visibleModals,
        bridgeERC20: true,
        bridgeERC721: false,
        dialogue: false,
        kami: false,
        kamisNaming: false,
        map: false,
        nameKami: false,
        node: false
      },
    });
  } else {
    dataStore.setState({ visibleModals: { ...visibleModals, bridgeERC20: false } });
  }
};
