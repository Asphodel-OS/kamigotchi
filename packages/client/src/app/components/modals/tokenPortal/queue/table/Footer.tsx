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
    setMode(mode === 'MINE' ? 'ALL' : 'MINE');
    playClick();
  };

  return (
    <Container>
      <IconButton text={`<${mode}>`} onClick={toggleMode} />
    </Container>
  );
};

const Container = styled.div`
  position: sticky;
  background-color: rgb(221, 221, 221);
  bottom: 0;
  width: 100%;
  height: 3vw;
  opacity: 0.9;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
  align-items: center;
`;
