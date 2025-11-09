import styled from 'styled-components';

import { Overlay, Text, TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

export const KamiBlockMini = ({
  kami,
  scale = 6,
  select,
  tooltip = [],
  show = { index: true },
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
    index?: boolean;
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
    <Container>
      <TextTooltip text={tooltip}>
        <Image src={kami.image} scale={scale} onClick={handleClick} />
        {show?.index && (
          <Overlay bottom={0} fullWidth>
            <Text color='#fff' shadow={{ blur: 0.3 }}>
              {index}
            </Text>
          </Overlay>
        )}
        {select && (
          <Overlay bottom={0.5}>
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
  border-radius: 0.6vw;
  filter: drop-shadow(0.2vw 0.2vw 0.1vw black);
`;

const Image = styled.img<{ scale: number; onClick?: () => void }>`
  border: solid black 0.15vw;
  border-radius: 0.6vw;

  width: ${({ scale }) => scale}vw;
  user-drag: none;

  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'inherit')};
  pointer-events: ${({ onClick }) => (onClick ? 'auto' : 'none')};
  &:hover {
    opacity: 0.6;
  }
`;

const ClickBox = styled.input`
  width: 1.2vw;
  height: 1.2vw;
  opacity: 0.7;
  user-select: none;
`;
