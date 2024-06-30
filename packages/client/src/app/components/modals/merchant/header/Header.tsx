import { Account } from 'network/shapes/Account';
import { Merchant } from 'network/shapes/Merchant';
import styled from 'styled-components';

export interface Props {
  merchant: Merchant;
  player: Account;
}

export const Header = (props: Props) => {
  const { merchant, player } = props;

  return (
    <Container>
      <Title>{`${merchant?.name}'s Shop`}</Title>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0.5vw;
`;

const Title = styled.div`
  width: 100%;
  padding: 1vw;

  color: black;
  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;
`;
