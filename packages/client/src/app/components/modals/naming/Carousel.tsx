import styled from 'styled-components';

import { isDead, isHarvesting, isResting } from 'app/cache/kami';
import { EmptyText, Overlay, Text } from 'app/components/library';
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
      <Overlay top={0.75} left={0.75}>
        <Text size={0.9}>Your Party</Text>
      </Overlay>
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
        <EmptyText
          text={['No Kami?', 'Step. Up. Your. Game.']}
          size={1.5}
          isHidden={!!kamis.length}
        />
      </Overlay>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border: solid black;
  border-width: 0.15vw 0.6vw 0 0.6vw;
  width: 100%;
  height: 15vw;

  display: flex;
  flex-flow: column nowrap;
`;

const Scrollable = styled.div`
  height: 100%;
  width: 100%;
  padding-left: 1.8vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;

  overflow-x: scroll;
`;
