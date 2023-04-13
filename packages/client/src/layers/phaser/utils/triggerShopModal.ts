import { dataStore } from 'layers/react/store/createStore';

export const triggerShopModal = () => {
  const { visibleModals } = dataStore.getState();
  console.log("fired")
  dataStore.setState({
    visibleModals: { ...visibleModals, merchant: true },
  });
}
