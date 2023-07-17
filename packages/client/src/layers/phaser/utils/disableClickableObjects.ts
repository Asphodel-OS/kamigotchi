import { dataStore } from 'layers/react/store/createStore';

export function disableClickableObjects(e: Phaser.Input.Pointer): boolean {
  const {
    visibleModals: {
      chat,
      dialogue,
      kami,
      map,
      merchant,
      nameKami,
      node,
      party,
      roomMovement,
    },
  } = dataStore.getState();

  const modals = [
    { id: 'chat_modal', isVisible: chat },
    { id: 'object_modal', isVisible: dialogue },
    { id: 'kamiModal', isVisible: kami },
    { id: 'world_map', isVisible: map },
    { id: 'merchant', isVisible: merchant },
    { id: 'node', isVisible: node },
    { id: 'party_modal', isVisible: party },
    { id: 'name_kami_modal', isVisible: nameKami },
    { id: 'roomMovement', isVisible: roomMovement },
  ];

  // Check if the bounding rectangle of the image overlaps with any of the modals
  for (let i = 0; i < modals.length; i++) {
    if (modals[i].isVisible) {
      const modalDiv = document.getElementById(modals[i].id);

      // Get the position and dimensions of the React modal
      const modalRect = modalDiv!.getBoundingClientRect();
      const modalLeft = modalRect.left;
      const modalRight = modalRect.right;
      const modalTop = modalRect.top;
      const modalBottom = modalRect.bottom;

      // Check if the bounding rectangles of the image and modal intersect
      if (
        e.downX > modalLeft &&
        e.downX < modalRight &&
        e.downY > modalTop &&
        e.downY < modalBottom
      ) {
        return true;
      }
    }
  }

  return false;
}
