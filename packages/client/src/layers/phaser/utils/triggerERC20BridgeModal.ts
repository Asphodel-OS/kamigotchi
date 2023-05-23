import { dataStore } from 'layers/react/store/createStore';

export const triggerERC20BridgeModal = () => {
  const { visibleModals } = dataStore.getState();
  if (!visibleModals.ERC20Bridge)
    dataStore.setState({
      visibleModals: { ...visibleModals, ERC20Bridge: true },
    });
};
