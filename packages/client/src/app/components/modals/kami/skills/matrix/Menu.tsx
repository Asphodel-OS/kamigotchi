import { ActionButton, TextTooltip } from 'app/components/library';
import styled from 'styled-components';

export const Menu = ({
  options,
  mode,
  setMode,
}: {
  options: string[];
  mode: string;
  setMode: (mode: string) => void;
}) => {
  return (
    <Container>
      {options.map((treeName) => {
        const name = treeName.toLowerCase();
        const label = mode === treeName ? name : name[0];
        return (
          <TextTooltip key={name} text={[`${name} tree`]}>
            <ActionButton text={label} onClick={() => setMode(treeName)} />
          </TextTooltip>
        );
      })}
    </Container>
  );
};

const Container = styled.div`
  position: sticky;
  border-bottom: solid black 0.15em;
  background-color: #999;
  opacity: 0.9;
  top: 0;
  width: 100%;
  padding: 0.6em 0.6em;
  gap: 1em;
  z-index: 1;

  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  align-items: center;
`;
