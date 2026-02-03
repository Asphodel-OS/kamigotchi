import { Modals, useVisibility } from 'app/stores';
import { useIsMobile } from './useIsMobile';
import { getPortraitCollidingModals, useIsPortrait } from './useIsPortrait';

/* if isMobile: closes all other modals
    isPortrait: closes modals in the same column 
    else closes modals as we have always done
 */
export const useModalToggle = () => {
  const setModals = useVisibility((s) => s.setModals);
  const isMobile = useIsMobile();
  const isPortrait = useIsPortrait();

  const toggleModal = (targetModal: keyof Modals, hideModals?: Partial<Modals>) => {
    const { modals } = useVisibility.getState();
    const isModalOpen = modals[targetModal];
    let nextModals: Partial<Modals> = { [targetModal]: !isModalOpen };

    if (!isModalOpen) {
      if (isMobile) {
        const allClosed = Object.fromEntries(Object.keys(modals).map((key) => [key, false]));
        nextModals = { ...allClosed, [targetModal]: true };
      } else if (isPortrait) {
        const collidingModals = getPortraitCollidingModals(targetModal);
        nextModals = { ...nextModals, ...collidingModals };
      } else if (hideModals) {
        nextModals = { ...nextModals, ...hideModals };
      }
    }

    setModals(nextModals);
  };

  return toggleModal;
};
