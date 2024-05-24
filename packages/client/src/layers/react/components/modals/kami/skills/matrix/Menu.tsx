import { ActionButton, Tooltip } from 'layers/react/components/library';
import styled from 'styled-components';

interface Props {
  options: string[];
  mode: string;
  setMode: (mode: string) => void;
}

export const Menu = (props: Props) => {
  const { options, mode, setMode } = props;
  return (
    <Container>
      {options.map((treeName) => {
        const name = treeName.toLowerCase();
        const label = mode === treeName ? name : name[0];
        return (
          <Tooltip key={name} text={[`${name} tree`]}>
            <ActionButton text={label} onClick={() => setMode(treeName)} />
          </Tooltip>
        );
      })}
    </Container>
  );
};

const Container = styled.div`
  position: absolute;
  border-bottom: solid black 0.15vw;
  background-color: #999;
  opacity: 0.9;
  z-index: 1;

  width: 100%;
  padding: 0.6vw 0.6vw;
  gap: 1vw;

  display: flex;
  flex-flow: row;
  justify-content: center;
  align-items: center;
`;
