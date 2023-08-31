import { dataStore } from 'layers/react/store/createStore';
import clickSound from 'assets/sound/fx/mouseclick.wav';

export const triggerRoomMovementModal = (room: number) => {
  const {
    selectedEntities,
    visibleModals,
    sound: { volume },
  } = dataStore.getState();

  const clickFX = new Audio(clickSound);
  clickFX.volume = volume;
  clickFX.play();

  // if already open on this room, close the modal
  if (visibleModals.roomMovement && selectedEntities.room === room) {
    dataStore.setState({
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
        emaBoard: false,
        map: false,
        nameKami: false,
      },
    });
  }
};
