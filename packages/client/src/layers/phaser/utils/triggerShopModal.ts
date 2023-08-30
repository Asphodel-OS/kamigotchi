import { dataStore } from 'layers/react/store/createStore';
import clickSound from 'assets/sound/fx/mouseclick.wav';

export const triggerShopModal = () => {
  const {
    visibleModals,
    sound: { volume },
  } = dataStore.getState();

  const clickFX = new Audio(clickSound);
  clickFX.volume = volume;
  clickFX.play();

  if (!visibleModals.merchant) {
    dataStore.setState({
      visibleModals: {
        ...visibleModals,
        merchant: true,
        map: false,
      },
    });
  } else {
    dataStore.setState({ visibleModals: { ...visibleModals, merchant: false } });
  }
}
