import { dataStore } from 'layers/react/store/createStore';

export const triggerERC721BridgeModal = () => {
  const { visibleModals } = dataStore.getState();
  if (!visibleModals.ERC721Bridge)
    dataStore.setState({
      visibleModals: { ...visibleModals, ERC721Bridge: true },
    });
};
