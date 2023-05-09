import { dataStore } from 'layers/react/store/createStore';

export const closeModalsOnRoomChange = () => {
  const { visibleModals } = dataStore.getState();

  dataStore.setState({
    visibleModals: {
      ...visibleModals,
      dialogue: false,
      merchant: false,
      kamiMint: false,
      kami: false,
      node: false,
    },
  });
};
