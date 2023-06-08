import { dataStore } from 'layers/react/store/createStore';

export const triggerERC20BridgeModal = () => {
  const { visibleModals } = dataStore.getState();
  if (!visibleModals.bridgeERC20)
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
};
