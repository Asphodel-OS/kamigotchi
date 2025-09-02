import styled from 'styled-components';

import { Overlay, TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

export const KamiBlock = ({
  kami,
  select,
  tooltip = [],
}: {
  kami: Kami;
  select?: {
    onClick?: () => void;
    isDisabled?: boolean;
    isSelected?: boolean;
  };
  tooltip?: string[];
}) => {
  const { index, progress, name } = kami;
  const { kamiIndex, setKami } = useSelected();
  const { modals, setModals } = useVisibility();

  // toggle the kami modal depending on its current state
  const handleClick = () => {
    const sameKami = kamiIndex === kami.index;
    if (!sameKami) setKami(kami.index);
    if (modals.kami && sameKami) setModals({ kami: false });
    else setModals({ kami: true });
    playClick();
  };

  return (
    <Container>
      <TextTooltip text={tooltip}>
        <Image src={kami.image} onClick={handleClick} />
        <Overlay top={0.9} left={0.7}>
          <Grouping>
            <Text size={0.6}>Lvl</Text>
            <Text size={0.6}>{progress?.level ?? '???'}</Text>
          </Grouping>
        </Overlay>
        <Overlay top={0.9} right={0.7}>
          <Text size={0.6}>{index}</Text>
        </Overlay>
        <Overlay bottom={0.6} fullWidth>
          <Text size={0.6}>{name}</Text>
        </Overlay>
        {select && (
          <Overlay bottom={0.5} right={0.5}>
            <ClickBox
              type='checkbox'
              disabled={!!select.isDisabled}
              checked={!!select.isSelected}
              onChange={select.onClick}
            />
          </Overlay>
        )}
      </TextTooltip>
    </Container>
  );
};

const Container = styled.div`
  background-color: white;
  border-radius: 0.6em;
  margin: 0.9em;
  filter: drop-shadow(0.2em 0.2em 0.1em black);
`;

const Image = styled.img<{ onClick?: () => void }>`
  border: solid black 0.15em;
  border-radius: 0.6em;
  width: 10em;
  image-rendering: pixelated;
  user-drag: none;

  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'inherit')};
  pointer-events: ${({ onClick }) => (onClick ? 'auto' : 'none')};
  &:hover {
    opacity: 0.6;
  }
`;

const Grouping = styled.div`
  position: relative;
  height: 100%;

  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
`;

const Text = styled.div<{ size: number }>`
  color: white;
  font-size: ${({ size }) => size}em;
  text-shadow: ${({ size }) => `0 0 ${size * 0.5}em black`};
`;

const ClickBox = styled.input`
  width: 1.8em;
  height: 1.8em;
  opacity: 0.9;
  user-select: none;
`;
