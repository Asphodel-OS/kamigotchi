import styled from 'styled-components';

import { Pairing } from 'app/components/library';
import { ItemImages } from 'assets/images/items';

export const Balance = ({
  balance,
}: {
  balance: number;
}) => {

  return (
    <Container>
      <Title>Balance</Title>
      <Content>
        <Pairing icon={ItemImages.musu} text={balance.toLocaleString()} scale={0.9} />
      </Content>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border: solid black 0.15em;
  border-radius: 0.4em;

  margin: 2em 0 1.2em 0;
  height: 59%;
  width: 30%;

  overflow: hidden;

  display: flex;
  flex-flow: column nowrap;
  justify-content: stretch;
  align-items: stretch;

  user-select: none;
`;

const Title = styled.div`
  background-color: #ddd;
  width: 100%;
  padding: 0.8em;
  opacity: 0.9;

  color: black;
  font-size: 1em;
  z-index: 1;
`;

const Content = styled.div`
  height: 100%;
  padding-left: 0.6em;
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  justify-content: center;
`;
