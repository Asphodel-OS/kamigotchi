import styled from 'styled-components';

import { Account } from 'network/shapes/Account';
import { Factions } from '../Factions';

interface Props {
  data: { account: Account };
}

export const FactionsBottom = (props: Props) => {
  const { data } = props;
  const { account } = data;

  /////////////////
  // RENDERING

  return (
    <Container>
      <Factions data={{ account }} />
    </Container>
  );
};

const Container = styled.div`
  border: solid 0.15vw black;
  border-radius: 0 0 0.6vw 0.6vw;
  width: 100%;
  height: 100%;
  background-color: white;
  padding: 0.45vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;

  overflow-y: auto;
`;
