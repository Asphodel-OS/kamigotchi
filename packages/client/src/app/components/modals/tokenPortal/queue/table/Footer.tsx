import { IconButton } from 'app/components/library';
import styled from 'styled-components';
import { playClick } from 'utils/sounds';
import { Filter } from './constants';

export const Footer = ({ state }: { state: { mode: Filter; setMode: (mode: Filter) => void } }) => {
  const { mode, setMode } = state;

  /////////////////
  // INTERACTION

  // toggle between depositing and withdrawing
  const toggleMode = () => {
    setMode(mode === 'MINE' ? 'OTHERS' : 'MINE');
    playClick();
  };

  return (
    <Container>
      <IconButton text={`<${mode}>`} onClick={toggleMode} />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  background-color: rgb(221, 221, 221);
  width: 100%;
  height: 3vw;
  flex-shrink: 0;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
  align-items: center;
`;
