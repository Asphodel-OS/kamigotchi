import { useComponentSettings } from 'layers/react/store/componentSettings';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';
import { playClick } from 'utils/sounds';

export const triggerRoomMovementModal = (location: number) => {
  const { room, setRoom } = useSelectedEntities.getState();
  const { modals } = useComponentSettings.getState();
  playClick();

  // if already open on this room, close the modal
  if (modals.roomMovement && room === location) {
    useComponentSettings.setState({
      modals: { ...modals, roomMovement: false }
    });
  } else {
    setRoom(location);
    useComponentSettings.setState({
      modals: {
        ...modals,
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
