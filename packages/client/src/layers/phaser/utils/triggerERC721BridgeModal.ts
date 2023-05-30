import { dataStore } from 'layers/react/store/createStore';

export const triggerERC721BridgeModal = () => {
  const { visibleModals } = dataStore.getState();
  if (!visibleModals.bridgeERC721)
    dataStore.setState({
      visibleModals: { ...visibleModals, bridgeERC721: true },
    });
};
