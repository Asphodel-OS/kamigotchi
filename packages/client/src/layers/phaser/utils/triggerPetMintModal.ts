import { dataStore } from 'layers/react/store/createStore';

export const triggerPetMintModal = () => {
  const { visibleModals } = dataStore.getState();
  if (!visibleModals.kamiMintPost)
    dataStore.setState({
      visibleModals: {
        ...visibleModals,
        kamiMint: true,
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        kami: false,
        kamisNaming: false,
        map: false,
        nameKami: false,
        node: false,
      },
    });
};
