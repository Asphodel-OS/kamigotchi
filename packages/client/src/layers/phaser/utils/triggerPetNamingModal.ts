import { dataStore } from 'layers/react/store/createStore';

export const triggerPetNamingModal = () => {
  const { visibleModals } = dataStore.getState();
  if (!visibleModals.kamisNaming)
    dataStore.setState({
      visibleModals: { ...visibleModals, kamisNaming: true },
    });
};
