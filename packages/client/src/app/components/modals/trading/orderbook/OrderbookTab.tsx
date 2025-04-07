import { EntityID, EntityIndex } from '@mud-classic/recs';
import { BigNumberish } from 'ethers';
import { useState } from 'react';
import styled from 'styled-components';

import { Popover } from 'app/components/library';
import { ActionIcons } from 'assets/images/icons/actions';
import { Trade } from 'network/shapes/Trade/types';
import { ActiveOffers } from '../ActiveOffers';

interface Props {
  actions: {
    executeTrade: (tradeId: BigNumberish) => void;
    cancelTrade: (tradeId: BigNumberish) => void;
    createTrade: (
      buyIndices: Number,
      buyAmts: BigNumberish,
      sellIndices: Number,
      sellAmts: BigNumberish
    ) => EntityID;
  };
  controls: {
    tab: string;
  };
  data: {
    accountEntity: EntityIndex;
    trades: Trade[];
  };
  isVisible: boolean;
}

export const OrderbookTab = (props: Props) => {
  const { actions, controls, data } = props;
  const { executeTrade, cancelTrade } = actions;
  const { tab } = controls;

  const [ascending, setAscending] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('Price \u0245');
  const [search, setSearch] = useState<string>('');

  const options = [
    {
      text: filter === 'Price \u0245' ? 'Price v' : 'Price \u0245',
      onClick: () => {
        if (filter === 'Price \u0245') {
          setFilter('Price v');
          setAscending(false);
        } else {
          setFilter('Price \u0245');
          setAscending(true);
        }
      },
    },
  ];

  const OptionsMap = () => {
    return options.map((option, i) => (
      <PopOverButton key={`div-${i}`} onClick={option.onClick}>
        {option.text}
      </PopOverButton>
    ));
  };

  return (
    <Container isVisible={tab === `Orderbook`}>
      <Row>
        <Label>
          SEARCH
          <Search onChange={(e) => setSearch(e.target.value)} placeholder='Search an item...' />
        </Label>
        <Label>
          SORT BY
          <Popover closeOnClick={true} content={OptionsMap()}>
            <Sort>{filter} </Sort>
          </Popover>
        </Label>
      </Row>
      <ActiveOffers
        actions={{
          executeTrade,
          cancelTrade,
        }}
        data={data}
        controls={{ ascending, search }}
        managementTab={false}
      />
    </Container>
  );
};

const Row = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

const Label = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 1vw;
  position: relative;
  width: 49%;
`;

const Search = styled.input`
  border-radius: 0.6vw;
  border: 0.15vw solid black;
  margin: 4% 0 0 0;
  min-height: 3vw;
  background: url(${ActionIcons.search}) no-repeat left center;
  background-origin: content-box;
  padding: 0.5vw 1vw;
  background-size: contain;
  text-align: center;
  font-size: 0.8vw;
  &::placeholder {
    position: absolute;
    left: 20%;
    background-color: white;
  }
`;

const Sort = styled.button`
  display: flex;
  border-radius: 0.6vw;
  border: 0.15vw solid black;

  margin: 4% 0 0 0;
  min-height: 3vw;
  width: 100%;
  font-size: 1vw;
  align-items: center;
  padding-left: 1vw;
  background-color: white;
`;

const Container = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-direction: column;
`;

const PopOverButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.4vw;
  font-size: 1vw;
  width: 19vw;
  border-color: transparent;
  background-color: white;
  &:hover {
    filter: brightness(0.8);
    cursor: pointer;
  }
`;
