import styled from 'styled-components';
import { Tooltip } from './Tooltip';

import { Modals, useVisibility } from 'layers/react/store/visibility';
import { playClick } from 'utils/sounds';

interface Props {
  id: string;
  image: string;
  tooltip: string;
  targetDiv: keyof Modals;
  visible: boolean;
  hideModals?: Partial<Modals>;
  onClick?: () => void;
}

// MenuButton renders a button that toggles a target modal.
export const MenuButton = (props: Props) => {
  const { modals, setModals } = useVisibility();
  const { id, image, tooltip, targetDiv, visible, hideModals, onClick } = props;

  // toggles the target modal open and closed
  const handleToggle = () => {
    playClick();
    if (onClick) onClick();

    const isModalOpen = modals[targetDiv];
    let nextModals = { ...modals, [targetDiv]: !isModalOpen };
    if (!isModalOpen) nextModals = { ...nextModals, ...hideModals };
    setModals(nextModals);
  };

  // catch clicks on modal, prevents duplicate Phaser3 triggers
  const handleClicks = (event: any) => {
    event.stopPropagation();
  };
  const element = document.getElementById(id);
  element?.addEventListener('mousedown', handleClicks);

  return (
    <Tooltip text={[tooltip]}>
      <div id={id}>
        <Button style={{ display: visible ? 'flex' : 'none' }} onClick={handleToggle}>
          <Image src={image} alt={id} />
        </Button>
      </div>
    </Tooltip>
  );
};

const Button = styled.button`
  border-radius: 10px;
  cursor: pointer;
  pointer-events: auto;

  &:active {
    background-color: #c4c4c4;
  }
`;

const Image = styled.img`
  height: 100%;
  width: auto;
`;
