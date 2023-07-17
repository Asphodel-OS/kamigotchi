import { dataStore } from 'layers/react/store/createStore';

export const triggerRoomMovementModal = (room: number) => {
  const { selectedEntities, visibleModals } = dataStore.getState();

  // if already open on this room, close the modal
  if (visibleModals.roomMovement && selectedEntities.room === room) {
    return dataStore.setState({
      visibleModals: { ...visibleModals, roomMovement: false }
    });
  } else {
    dataStore.setState({
      selectedEntities: { ...selectedEntities, room },
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
  }
};
