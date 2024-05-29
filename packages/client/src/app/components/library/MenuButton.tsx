import styled from 'styled-components';
import { Tooltip } from './Tooltip';

import { Modals, useVisibility } from 'app/store';
import { playClick } from 'utils/sounds';

interface Props {
  id: string;
  image: string;
  tooltip: string;
  targetModal?: keyof Modals;
  hideModals?: Partial<Modals>;
  onClick?: () => void;
}

// MenuButton renders a button that toggles a target modal.
export const MenuButton = (props: Props) => {
  const { modals, setModals } = useVisibility();
  const { id, image, tooltip, targetModal, hideModals, onClick } = props;

  // toggles the target modal open and closed
  const handleToggle = () => {
    playClick();
    if (onClick) onClick();
    if (!targetModal) return;

    const isModalOpen = modals[targetModal];
    let nextModals = { ...modals, [targetModal]: !isModalOpen };
    if (!isModalOpen) nextModals = { ...nextModals, ...hideModals };
    setModals(nextModals);
  };

  return (
    <Tooltip text={[tooltip]}>
      <div id={id}>
        <Button onClick={handleToggle}>
          <Image src={image} alt={id} />
        </Button>
      </div>
    </Tooltip>
  );
};

const Button = styled.button`
  height: 4.5vh;
  border-radius: 0.9vh;
  border: solid black 0.15vw;
  cursor: pointer;
  pointer-events: auto;

  &:active {
    background-color: #c4c4c4;
  }
`;

const Image = styled.img`
  height: 100%;
  width: auto;
  padding: 0.15vh;
`;
