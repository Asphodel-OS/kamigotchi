import { dataStore } from 'layers/react/store/createStore';
import clickSound from 'assets/sound/fx/mouseclick.wav';

export const triggerNodeModal = () => {
  const {
    visibleModals,
    sound: { volume },
  } = dataStore.getState();

  const clickFX = new Audio(clickSound);
  clickFX.volume = volume;
  clickFX.play();

  dataStore.setState({
    visibleModals: {
      ...visibleModals,
      node: true,
      bridgeERC20: false,
      bridgeERC721: false,
      dialogue: false,
      kami: false,
      kamiMint: false,
      kamisNaming: false,
      map: false,
      nameKami: false,
    },
  });
};
