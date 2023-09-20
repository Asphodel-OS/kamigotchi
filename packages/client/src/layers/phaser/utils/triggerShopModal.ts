import { dataStore } from 'layers/react/store/createStore';
import { playClick } from 'utils/sounds';

export const triggerShopModal = () => {
  const { visibleModals } = dataStore.getState();
  playClick();

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
