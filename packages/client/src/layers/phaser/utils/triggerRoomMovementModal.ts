import { dataStore } from 'layers/react/store/createStore';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';
import { playClick } from 'utils/sounds';

export const triggerRoomMovementModal = (location: number) => {
  const { room, setRoom } = useSelectedEntities.getState();
  const { visibleModals } = dataStore.getState();
  playClick();

  // if already open on this room, close the modal
  if (visibleModals.roomMovement && room === location) {
    dataStore.setState({
      visibleModals: { ...visibleModals, roomMovement: false }
    });
  } else {
    setRoom(location);
    dataStore.setState({
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
