import styled from 'styled-components';

import { Tooltip } from 'app/components/library/poppers/Tooltip';
import { Modals, useVisibility } from 'app/stores';
import { clickFx, hoverFx } from 'app/styles/effects';
import { playClick } from 'utils/sounds';

interface Props {
  id: string;
  image: string;
  tooltip: string;
  targetModal?: keyof Modals;
  hideModals?: Partial<Modals>;
  onClick?: () => void;
  disabled?: boolean;
}

// MenuButton renders a button that toggles a target modal.
export const MenuButton = (props: Props) => {
  const { modals, setModals } = useVisibility();
  const { id, image, disabled, tooltip, targetModal, hideModals, onClick } = props;

  // toggles the target modal open and closed
  const handleToggle = () => {
    playClick();
    if (onClick) onClick();
    if (!targetModal) return;

    const isModalOpen = modals[targetModal];
    let nextModals = { [targetModal]: !isModalOpen };
    if (!isModalOpen) nextModals = { ...nextModals, ...hideModals };
    setModals(nextModals);
  };

  return (
    <Tooltip text={[tooltip]}>
      <div id={id}>
        <Button onClick={handleToggle} effectScale={0.1} disabled={disabled}>
          <Image src={image} alt={id} />
        </Button>
      </div>
    </Tooltip>
  );
};

interface ButtonProps {
  effectScale: number;
  disabled?: boolean;
}

const Button = styled.button<ButtonProps>`
  height: 4.5vh;
  border-radius: 0.9vh;
  border: solid black 0.15vw;
  cursor: pointer;
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

  &:hover {
    animation: ${({ effectScale }) => hoverFx(effectScale)} 0.2s;
    transform: scale(${({ effectScale }) => 1 + effectScale});
  }
  &:active {
    animation: ${({ effectScale }) => clickFx(effectScale)} 0.3s;
  }
`;

const Image = styled.img`
  height: 100%;
  width: auto;
  padding: 0.15vh;
  user-drag: none;
`;
