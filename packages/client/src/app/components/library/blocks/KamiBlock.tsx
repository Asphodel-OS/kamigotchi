import styled from 'styled-components';

import { Overlay, Text, TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

export const KamiBlock = ({
  kami,
  scale = 9,
  margin = 0.6,
  select,
  tooltip = [],
  show = { level: true, index: true, name: true },
}: {
  kami: Kami;
  scale?: number;
  margin?: number;
  select?: {
    onClick?: () => void;
    isDisabled?: boolean;
    isSelected?: boolean;
  };
  show?: {
    level?: boolean;
    index?: boolean;
    name?: boolean;
  };
  tooltip?: string[];
}) => {
  const { index, progress, name } = kami;
  const kamiIndex = useSelected((s) => s.kamiIndex);
  const setKami = useSelected((s) => s.setKami);
  const kamiModalOpen = useVisibility((s) => s.modals.kami);
  const setModals = useVisibility((s) => s.setModals);

  // toggle the kami modal depending on its current state
  const handleClick = () => {
    const sameKami = kamiIndex === kami.index;
    if (!sameKami) setKami(kami.index);
    if (kamiModalOpen && sameKami) setModals({ kami: false });
    else setModals({ kami: true });
    playClick();
  };

  return (
    <Container margin={margin}>
      <TextTooltip text={tooltip}>
        <Image src={kami.image} scale={scale} onClick={handleClick} />
        {show?.level && (
          <Overlay top={0.9} left={0.7}>
            <Text color='#fff' shadow={{ blur: 0.3 }}>
              Lvl{progress?.level ?? '???'}
            </Text>
          </Overlay>
        )}
        {show?.index && (
          <Overlay top={0.9} right={0.7}>
            <Text color='#fff' shadow={{ blur: 0.3 }}>
              {index}
            </Text>
          </Overlay>
        )}
        {show?.name && (
          <Overlay bottom={0.6} fullWidth>
            <Text color='#fff' shadow={{ blur: 0.3 }}>
              {name}
            </Text>
          </Overlay>
        )}
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

const Container = styled.div<{ margin: number }>`
  margin: ${({ margin }) => margin}vw;
  filter: drop-shadow(0.2vw 0.2vw 0.1vw black);
`;

const Image = styled.img<{ scale: number; onClick?: () => void }>`
  border: solid black 0.15vw;
  border-radius: 0.6vw;

  width: ${({ scale }) => scale}vw;
  image-rendering: pixelated;
  user-drag: none;

  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'inherit')};
  pointer-events: ${({ onClick }) => (onClick ? 'auto' : 'none')};
  &:hover {
    opacity: 0.6;
  }
`;

const ClickBox = styled.input`
  width: 1.8vw;
  height: 1.8vw;
  opacity: 0.9;
  user-select: none;
`;
