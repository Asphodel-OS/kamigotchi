import styled from 'styled-components';

import { IconButton, KamiBlock, Overlay } from 'app/components/library';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { Kami } from 'network/shapes/Kami';

export const Controls = ({
  actions,
  state,
}: {
  actions: {
    import: (kamis: Kami[]) => void;
    export: (kamis: Kami[]) => void;
  };
  state: {
    selectedWild: Kami[];
    setSelectedWild: (kamis: Kami[]) => void;
    selectedWorld: Kami[];
    setSelectedWorld: (kamis: Kami[]) => void;
  };
}) => {
  const { selectedWild, selectedWorld, setSelectedWild, setSelectedWorld } = state;

  // this allows importing and exporting at the same time
  const handleAction = () => {
    const kamisToImport = selectedWild;
    const kamisToExport = selectedWorld;
    if (kamisToImport.length > 0) {
      actions.import(kamisToImport);
    }
    if (kamisToExport.length > 0) {
      actions.export(kamisToExport);
    }
  };

  return (
    <Container expand={selectedWild.length > 0 || selectedWorld.length > 0}>
      <Overlay top={0.9} orientation='column' fullWidth>
        <Text size={0.9}>
          {selectedWild.length > 0
            ? `Import (${selectedWild.length})`
            : `Export (${selectedWorld.length})`}
        </Text>
        <IconButton
          img={selectedWild.length > 0 ? ArrowIcons.left : ArrowIcons.right}
          onClick={handleAction}
          text={selectedWild.length > 0 ? 'Import' : 'Export'}
          disabled={selectedWild.length === 0 && selectedWorld.length === 0}
        />
      </Overlay>
      <Scrollable>
        {selectedWild.length > 0 &&
          selectedWild.map((kami) => <KamiBlock key={`wild-${kami.index}`} kami={kami} />)}
        {selectedWorld.length > 0 &&
          selectedWorld.map((kami) => <KamiBlock key={`world-${kami.index}`} kami={kami} />)}
      </Scrollable>
      <Overlay top={30} fullWidth>
        <IconButton
          onClick={() => {
            setSelectedWild([]);
            setSelectedWorld([]);
          }}
          text={'Clear'}
          disabled={selectedWild.length === 0 && selectedWorld.length === 0}
        />
      </Overlay>
    </Container>
  );
};

const Container = styled.div<{ expand: boolean }>`
  position: relative;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  border-left: solid black 0.15vw;
  border-right: solid black 0.15vw;
  ${({ expand }) => (expand ? 'width: 40%; justify-content: flex-start;' : 'width: 23%;')}
  transition: width 0.8s ease-in-out;
  padding-top: 6vw;
  will-change: width;
  overflow: hidden;
`;

const Scrollable = styled.div`
  display: flex;
  flex-flow: row;
  overflow-y: scroll;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
  margin-bottom: 1vw;
`;
