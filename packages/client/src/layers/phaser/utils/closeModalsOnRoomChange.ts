import { dataStore } from 'layers/react/store/createStore';

export const closeModalsOnRoomChange = () => {
  const { visibleDivs } = dataStore.getState();

  dataStore.setState({
    visibleDivs: { ...visibleDivs, objectModal: false, merchant: false, mintProcess: false, petMint: false },
  });
};
