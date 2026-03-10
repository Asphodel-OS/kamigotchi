import { useVisibility } from 'app/stores';
import { playClick } from 'utils/sounds';

export const triggerERC20BridgeModal = () => {
  const { modals, setModals } = useVisibility.getState();
  playClick();

  if (!modals.bridgeERC20) {
    setModals({
      ...modals,
      bridgeERC20: true,
      bridgeERC721: false,
      dialogue: false,
      kami: false,
      kamiAdoptionAgency: false,
      emaBoard: false,
      map: false,
      node: false,
      leaderboard: false,
    });
  } else {
    setModals({ ...modals, bridgeERC20: false });
  }
};
