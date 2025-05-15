import styled from 'styled-components';

import { isDead, isHarvesting, isResting } from 'app/cache/kami';
import { EmptyText, Overlay } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { KamiBlock } from '../../library/KamiBlock';

interface Props {
  kamis: Kami[];
  state: {
    setSelected: (kami: Kami) => void;
  };
}

export const Carousel = (props: Props) => {
  const { kamis, state } = props;
  const { setSelected } = state;

  const handleSelect = (kami: Kami) => {
    playClick();
    setSelected(kami);
  };

  const getTooltip = (kami: Kami) => {
    if (isHarvesting(kami)) return 'too far away';
    if (isDead(kami)) return 'the dead cannot hear you';
    return `a holy pact..`;
  };

  return (
    <Container>
      <Scrollable>
        {kamis.map((kami) => (
          <KamiBlock
            key={kami.index}
            kami={kami}
            select={{
              isDisabled: !isResting(kami),
              onClick: () => handleSelect(kami),
            }}
            tooltip={[getTooltip(kami)]}
          />
        ))}
      </Scrollable>
      <Overlay fullWidth fullHeight passthrough>
        <EmptyText text={['you have no kami']} size={1} isHidden={!!kamis.length} />
      </Overlay>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-top: solid black 0.15vw;
  width: 100%;
  height: 15vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Scrollable = styled.div`
  height: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  overflow-x: scroll;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
`;
