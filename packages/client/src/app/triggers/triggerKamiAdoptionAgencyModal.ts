import { useVisibility } from 'app/stores';
import { playClick } from 'utils/sounds';

export const triggerKamiAdoptionAgencyModal = () => {
  const { modals, setModals } = useVisibility.getState();
  playClick();

  if (!modals.kamiAdoptionAgency) {
    setModals({
      kamiAdoptionAgency: true,
      bridgeERC20: false,
      bridgeERC721: false,
      dialogue: false,
      kami: false,
      map: false,
    });
  } else {
    setModals({ kamiAdoptionAgency: false });
  }
};
