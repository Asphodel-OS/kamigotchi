import styled from 'styled-components';

import { objectMinaRed } from 'assets/images/rooms/13_giftshop';
import { Account } from 'network/shapes/Account';
import { NPC } from 'network/shapes/Npc';
import { Balance } from './Balance';

export const Header = ({
  merchant,
  player,
  balance,
}: {
  merchant: NPC;
  player: Account;
  balance: number;
}) => {

  return (
    <Container>
      <ShopDetails>
        <ShopImage src={objectMinaRed} />
        <ShopDescription>
          <Title>{`${merchant?.name}'s Shop`}</Title>
          <SubTitle>Buy something or get out.</SubTitle>
        </ShopDescription>
      </ShopDetails>
      <Balance balance={balance} />
    </Container>
  );
};

const Container = styled.div`
  margin: 0 1.2rem 0 1.2rem;

  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  user-select: none;
`;

const ShopDetails = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const ShopImage = styled.img`
  height: 9rem;
  padding: 0.9rem 1.2rem 0 1.2rem;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
`;

const ShopDescription = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  gap: 0.75rem;
`;

const Title = styled.div`
  color: black;
  font-family: Pixel;
  font-size: 3.2rem;
`;

const SubTitle = styled.div`
  padding-left: 0.6rem;
  color: #999;
  font-family: Pixel;
  font-size: 1.2rem;
`;
