import { dataStore } from 'layers/react/store/createStore';

export const triggerRoomMovementModal = (selectedRoom: number) => {
  const { visibleModals } = dataStore.getState();

  dataStore.setState({
    selectedRoom: selectedRoom,
    visibleModals: {
      ...visibleModals,
      roomMovement: true,
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
