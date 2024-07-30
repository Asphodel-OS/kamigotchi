import styled from 'styled-components';

import { objectMinaRed } from 'assets/images/rooms/13_giftshop';
import { Account } from 'network/shapes/Account';
import { Merchant } from 'network/shapes/Npc/merchant';

export interface Props {
  merchant: Merchant;
  player: Account;
}

export const Header = (props: Props) => {
  const { merchant, player } = props;

  return (
    <Container>
      <ShopDetails>
        <ShopImage src={objectMinaRed} />
        <ShopDescription>
          <Title>{`${merchant?.name}'s Shop`}</Title>
          <SubTitle>Buy something or get out.</SubTitle>
        </ShopDescription>
      </ShopDetails>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ShopDetails = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const ShopImage = styled.img`
  height: 9vw;
  padding: 0.9vh 1.2vw 0 1.2vw;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
`;

const ShopDescription = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  gap: 0.75vw;
`;

const Title = styled.div`
  color: black;
  font-family: Pixel;
  font-size: 3.2vw;
`;

const SubTitle = styled.div`
  padding-left: 0.6vw;
  color: #999;
  font-family: Pixel;
  font-size: 1.2vw;
`;
