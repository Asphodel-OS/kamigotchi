import { IconButton, TextTooltip } from 'app/components/library';
import { useIsMobile } from 'app/root/hooks';
import { Modals, useVisibility } from 'app/stores';
import { playClick } from 'utils/sounds';

// MenuButton renders a button that toggles a target modal.
export const MenuButton = ({
  id,
  image,
  disabled,
  tooltip,
  targetModal,
  hideModals,
  onClick,
}: {
  id: string;
  image: string;
  tooltip: string;
  targetModal?: keyof Modals;
  hideModals?: Partial<Modals>;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  const setModals = useVisibility((s) => s.setModals);
  const isModalOpen = useVisibility((s) => (targetModal ? s.modals[targetModal] : false));
  const isMobile = useIsMobile();

  // toggles the target modal open and closed
  const handleToggle = () => {
    playClick();
    if (onClick) onClick();
    if (!targetModal) return;

    let nextModals = { [targetModal]: !isModalOpen };
    if (!isModalOpen) {
      if (isMobile) {
        // Close everything except
        // the target modal
        const { modals } = useVisibility.getState();
        const allClosed = Object.fromEntries(Object.keys(modals).map((key) => [key, false]));
        nextModals = { ...allClosed, [targetModal]: true };
      } else {
        nextModals = { ...nextModals, ...hideModals };
      }
    }
    setModals(nextModals);
  };

  return (
    <div id={id}>
      <TextTooltip text={[tooltip]}>
        <IconButton img={image} onClick={handleToggle} radius={0.4} disabled={disabled} />
      </TextTooltip>
    </div>
  );
};
