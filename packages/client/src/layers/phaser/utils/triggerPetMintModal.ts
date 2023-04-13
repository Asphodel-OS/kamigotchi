import { dataStore } from 'layers/react/store/createStore';

export const triggerPetMintModal = () => {
  const { visibleModals } = dataStore.getState();
  // console.log('triggerPetMintModal', visibleModals);
  dataStore.setState({
    visibleModals: { ...visibleModals, kamiMint: true },
  });
}
