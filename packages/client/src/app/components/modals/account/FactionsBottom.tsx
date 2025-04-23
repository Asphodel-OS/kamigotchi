import styled from 'styled-components';

import { EmptyText } from 'app/components/library';
import { Account } from 'network/shapes/Account';

interface Props {
  account: Account; // account selected for viewing
}

export const FactionsBottom = (props: Props) => {
  const { account } = props;

  /////////////////
  // RENDERING

  return (
    <Container>
      <EmptyText text={['not yet implemented']} />
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
