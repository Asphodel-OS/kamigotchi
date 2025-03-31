import styled from 'styled-components';

import { ItemImages } from 'assets/images/items';
import { objectMinaRed } from 'assets/images/rooms/13_giftshop';
import { Account } from 'network/shapes/Account';
import { NPC } from 'network/shapes/Npc';

export interface Props {
  merchant: NPC;
  player: Account;
  balance: number;
}

export const Header = (props: Props) => {
  const { merchant, player, balance } = props;

  return (
    <Container>
      <ShopDetails>
        <ShopImage src={objectMinaRed} />
        <ShopDescription>
          <Title>{`${merchant?.name}'s Shop`}</Title>
          <SubTitle>Buy something or get out.</SubTitle>
        </ShopDescription>
      </ShopDetails>
      <BalanceContainer>
        <BalanceTitle>Balance</BalanceTitle>
        <BalanceContent>
          <BalanceIcon src={ItemImages.musu} />
          <BalanceNumber>{balance}</BalanceNumber>
        </BalanceContent>
      </BalanceContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const BalanceContainer = styled.div`
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

const BalanceTitle = styled.div`
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

const BalanceContent = styled.div`
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

const BalanceIcon = styled.img`
  width: 1.5vw;
  height: 1.5vw;
  margin: 0px 0.3vw;
`;

const BalanceNumber = styled.div`
  overflow-wrap: break-word;
  inline-size: 80%;
  line-height: 0.9vw;
  height: 1vw;
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
