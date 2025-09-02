import styled from 'styled-components';

import { TextTooltip } from 'app/components/library/poppers/TextTooltip';
import { Modals, useVisibility } from 'app/stores';
import { clickFx, hoverFx } from 'app/styles/effects';
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
  const { modals, setModals } = useVisibility();

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
    <TextTooltip text={[tooltip]}>
      <div id={id}>
        <Button onClick={handleToggle} effectScale={0.1} disabled={disabled}>
          <Image src={image} alt={id} />
        </Button>
      </div>
    </TextTooltip>
  );
};

const Button = styled.button<{
  effectScale: number;
  disabled?: boolean;
}>`
  height: 4.5em;
  border-radius: 0.9em;
  border: solid black 0.15em;
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
  padding: 0.15em;
  user-drag: none;
`;
