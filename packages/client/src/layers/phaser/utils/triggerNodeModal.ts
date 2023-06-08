import { dataStore } from 'layers/react/store/createStore';

export const triggerNodeModal = () => {
  const { visibleModals } = dataStore.getState();
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
