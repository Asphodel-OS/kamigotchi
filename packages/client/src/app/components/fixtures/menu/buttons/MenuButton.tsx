import { IconButton, TextTooltip } from 'app/components/library';
import { useModalToggle } from 'app/root/hooks';
import { Modals } from 'app/stores';
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
  const toggleModal = useModalToggle();

  // toggles the target modal open and closed
  const handleToggle = () => {
    playClick();
    if (onClick) onClick();
    if (!targetModal) return;
    toggleModal(targetModal, hideModals);
  };

  return (
    <div id={id}>
      <TextTooltip text={[tooltip]}>
        <IconButton img={image} onClick={handleToggle} radius={0.4} disabled={disabled} />
      </TextTooltip>
    </div>
  );
};
