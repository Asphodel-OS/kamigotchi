import styled from 'styled-components';

interface Props {
  balance: string;
  price: string;
  name: string;
  icon: string;
}

export const BalanceBar = (props: Props) => {
  return (
    <Container>
      <Column>
        <TitleText>{props.name}</TitleText>
        <Row>
          <Icon src={props.icon} />
          <NumberText>{props.price}</NumberText>
        </Row>
      </Column>
      <Column style={{ alignItems: 'flex-end' }}>
        <TitleText>Balance</TitleText>
        <Row>
          <Icon src={props.icon} />
          <NumberText>{props.balance}</NumberText>
        </Row>
      </Column>
    </Container>
  );
};

const Column = styled.div`
  display: flex;
  flex-direction: column;
`;

const Container = styled.div`
  width: 100%;

  display: flex;
  flex-direction: row;
  justify-content: space-between;

  padding: 1vh 2vw;
`;

const Icon = styled.img`
  height: 2.4vw;
`;

const TitleText = styled.div`
  font-family: Pixel;
  font-size: 0.8vw;
  text-align: left;
  padding: 1vh 0vw;
  color: #444;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const NumberText = styled.div`
  font-family: Pixel;
  font-size: 2vw;
  text-align: left;
  justify-content: flex-start;
  padding: 0 0 0 1.2vw;
  color: #333;
`;
