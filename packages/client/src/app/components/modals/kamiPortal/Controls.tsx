import styled from 'styled-components';

import { IconButton, KamiBlock } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';

export const Controls = ({
  actions,
  state,
}: {
  actions: {
    import: (kamis: Kami[]) => void;
  };
  state: {
    selectedWild: Kami[];
    setSelectedWild: (kamis: Kami[]) => void;
  };
}) => {
  const { selectedWild, setSelectedWild } = state;
  const expand = selectedWild.length > 0;

  return (
    <Container expand={expand}>
      <TopSection>
        <Text size={0.9}>{`Import (${selectedWild.length})`}</Text>
        <IconButton
          onClick={() => expand && actions.import(selectedWild)}
          text={'Import'}
          disabled={!expand}
          color='#C2F0C2'
        />
      </TopSection>
      <Scrollable>
        {selectedWild.map((kami) => (
          <KamiBlock key={`wild-${kami.index}`} kami={kami} />
        ))}
      </Scrollable>
      <BottomSection>
        <IconButton
          onClick={() => setSelectedWild([])}
          text={'Clear'}
          disabled={!expand}
          color='#E8F0FE'
        />
      </BottomSection>
    </Container>
  );
};

const Container = styled.div<{ expand: boolean }>`
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  border-left: solid black 0.15vw;

  flex: 0 0 ${({ expand }) => (expand ? '40%' : '24%')};
  transition: flex-basis 0.8s ease-in-out;
  will-change: flex-basis;
  overflow: hidden;
`;

const TopSection = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  padding: 1vw 0;
  gap: 0.6vw;
`;

const BottomSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1vw 0;
  margin-top: auto;
`;

const Scrollable = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  overflow-y: scroll;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
`;
