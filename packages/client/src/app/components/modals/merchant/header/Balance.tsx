import styled from 'styled-components';

import { ItemImages } from 'assets/images/items';

export interface Props {
  balance: number;
}

export const Balance = (props: Props) => {
  const { balance } = props;

  return (
    <Container>
      <Title>Balance</Title>
      <Content>
        <Icon src={ItemImages.musu} />
        <Number>{balance}</Number>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border: solid black 0.15vw;
  border-radius: 0.4vw;
  margin: 2vw 1.2vw 1.2vw 1.2vw;
  min-height: 70%;
  user-select: none;
  overflow: hidden;

  display: flex;
  flex-flow: row nowrap;
  justify-content: stretch;
  align-items: stretch;
  align-content: stretch;
  width: 30%;
`;

const Title = styled.div`
  position: absolute;
  background-color: #ddd;
  border-radius: 0 0.25vw 0 0;
  width: 100%;
  padding: 1.2vw;
  opacity: 0.9;

  color: black;
  font-size: 1.2vw;
  text-align: left;
  z-index: 1;
`;

const Content = styled.div`
  margin: 3.2vw 0.3vw 0.5vw 0.9vw;
  gap: 0.6vw;

  display: flex;
  flex-flow: column nowrap;

  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  scrollbar-color: transparent transparent;
  align-items: center;
  flex-direction: row;
  font-size: 0.9vw;
`;

const Icon = styled.img`
  width: 1.5vw;
  height: 1.5vw;
  margin: 0px 0.3vw;
`;

const Number = styled.div`
  overflow-wrap: break-word;
  inline-size: 80%;
  line-height: 0.9vw;
  height: 1vw;
`;
