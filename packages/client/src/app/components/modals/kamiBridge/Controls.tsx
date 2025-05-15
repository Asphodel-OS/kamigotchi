import styled from 'styled-components';

import { ActionButton } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';
import { Mode } from './types';

interface Props {
  actions: {
    import: (kamis: Kami[]) => void;
    export: (kamis: Kami[]) => void;
  };
  controls: {
    mode: Mode;
    setMode: (mode: Mode) => void;
  };
  state: {
    selectedKamis: Kami[];
  };
}

export const Controls = (props: Props) => {
  const { actions, controls, state } = props;
  const { mode, setMode } = controls;
  const { selectedKamis } = state;

  const handleToggle = () => {
    setMode(mode === 'IMPORT' ? 'EXPORT' : 'IMPORT');
  };

  const handleAction = () => {
    if (mode === 'IMPORT') actions.import(selectedKamis);
    else actions.export(selectedKamis);
  };

  return (
    <Container>
      <ActionButton onClick={handleToggle} text={'Filters'} disabled />
      <ActionButton onClick={handleToggle} text={mode === 'IMPORT' ? '↑' : '↓'} />
      <ActionButton
        onClick={handleAction}
        text={mode === 'IMPORT' ? 'Import' : 'Export'}
        disabled={selectedKamis.length == 0}
      />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-top: solid black 0.15vw;
  border-bottom: solid black 0.15vw;
  width: 100%;
  padding: 0.6vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
  align-items: center;
`;
