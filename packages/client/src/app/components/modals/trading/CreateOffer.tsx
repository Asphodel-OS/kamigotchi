import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { BigNumberish } from 'ethers';
import { useState } from 'react';
import styled from 'styled-components';

import { ActionButton, Popover } from 'app/components/library';
import { ActionIcons } from 'assets/images/icons/actions';
import { NetworkLayer } from 'network/create';
import { Item } from 'network/shapes/Item';
import { waitForActionCompletion } from 'network/utils';
import { CreateOfferCards } from './CreateOfferCards';

interface Props {
  network: NetworkLayer;
  utils: {
    getInventories: () => {
      id: EntityID;
      entity: EntityIndex;
      balance: number;
      item: Item;
    }[];
    getAllItems: () => Item[];
    getMusuBalance: () => number;
  };
}
export const CreateOffer = (props: Props) => {
  const { network, utils } = props;
  const { actions, api, world } = network;
  const { getInventories, getAllItems, getMusuBalance } = utils;

  const [search, setSearch] = useState<string>('');
  const [item, setItem] = useState<any>(null);
  const [max, setMax] = useState<any>(Infinity);

  const [buyIndices, setBuyIndices] = useState<number>(0);
  const [buyAmts, setBuyAmts] = useState<BigNumberish>(0);
  const [sellIndices, setSellIndices] = useState<number>(0);
  const [sellAmts, setSellAmts] = useState<BigNumberish>(0);
  const [sellToggle, setSellToggle] = useState<boolean>(true);

  const reset = () => {
    setSellAmts(0);
    setSellIndices(0);
    setBuyAmts(0);
    setBuyIndices(0);
    setItem(null);
  };

  const OptionsMap = (sellToggle: boolean) => {
    const items = sellToggle ? getInventories() : getAllItems();
    return items.map((item: any, i: number) => {
      const name = sellToggle ? item.item.name : item.name;
      return name.toLowerCase().includes(search.toLowerCase()) && name !== 'MUSU' ? (
        <PopOverButton
          key={i}
          onClick={() => {
            sellToggle
              ? (setMax(item.balance), setItem(item.item))
              : (setMax(Infinity), setItem(item));
          }}
        >
          {name}
        </PopOverButton>
      ) : null;
    });
  };

  /////////////////
  // ACTIONS

  const handleTrade = async (
    buyIndices: Number,
    buyAmts: BigNumberish,
    sellIndices: Number,
    sellAmts: BigNumberish
  ) => {
    try {
      const tradeActionID = createTrade(buyIndices, buyAmts, sellIndices, sellAmts);
      if (!tradeActionID) throw new Error('Trade action failed');
      // TODO: fix this, make reset only happen if trade is succesful
      await Promise.all([
        waitForActionCompletion(
          actions!.Action,
          world.entityToIndex.get(tradeActionID) as EntityIndex
        ),
        reset(),
      ]);
    } catch (e) {
      console.log('handleTrade() failed', e);
    }
  };

  const createTrade = (
    buyIndices: Number,
    buyAmts: BigNumberish,
    sellIndices: Number,
    sellAmts: BigNumberish
  ) => {
    const actionID = uuid() as EntityID;
    actions.add({
      action: 'create trade',
      params: [],
      description: `creating Trade `,
      execute: async () => {
        return api.player.trade.create([buyIndices], [buyAmts], [sellIndices], [sellAmts], 0);
      },
    });
    return actionID;
  };
  const CreateOffers = (price: boolean, max: any) => {
    return (
      <CreateOfferCards
        item={item}
        sellToggle={sellToggle}
        sellAmts={sellAmts}
        setSellAmts={setSellAmts}
        buyAmts={buyAmts}
        setBuyAmts={setBuyAmts}
        buyIndices={buyIndices}
        setBuyIndices={setBuyIndices}
        sellIndices={sellIndices}
        setSellIndices={setSellIndices}
        setItem={setItem}
        price={price}
        max={max}
      />
    );
  };

  return (
    <Content style={{ width: '50%' }}>
      <Body>
        <Title style={{ padding: ` 1.2vw 1.2vw 2.4vw 1.2vw` }}>Create Offer</Title>
        <Label>
          <Want>
            I want to:
            <ActionButton
              text={sellToggle ? 'Sell' : 'Buy'}
              onClick={() => {
                reset();
                setSellToggle(!sellToggle);
              }}
            />
          </Want>
          <Card style={{ flexDirection: 'column' }}>
            <Popover closeOnClick={true} content={OptionsMap(sellToggle)}>
              <Search
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                onBlur={(e) => {
                  e.target.value = '';
                }}
                placeholder='Search an item...'
              />
            </Popover>
            {CreateOffers(false, max)}
            <Divider /> For:
            {CreateOffers(true, sellToggle ? Infinity : getMusuBalance())}
          </Card>
        </Label>
      </Body>
      <Title style={{ bottom: 0, backgroundColor: `white` }}>
        <Buttons>
          <ActionButton
            text='Create'
            onClick={() => {
              handleTrade(buyIndices, buyAmts, sellIndices, sellAmts);
            }}
            disabled={buyIndices === 0 || buyAmts === 0 || sellIndices === 0 || sellAmts === 0}
          />
          <ActionButton
            text='Reset'
            onClick={() => {
              reset();
            }}
          />
        </Buttons>
      </Title>
    </Content>
  );
};

const Content = styled.div`
  width: 50%;
  height: 100%;
  overflow: hidden hidden;
`;

const Body = styled.div`
  position: relative;
  height: max-content;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  overflow: hidden scroll;
  scrollbar-color: transparent transparent;
`;

const Title = styled.div`
  position: sticky;
  top: 0;
  background-color: rgb(221, 221, 221);
  border-radius: 0.6vw;
  width: 100%;
  padding: 1.2vw;
  opacity: 0.9;
  color: black;
  font-size: 1.2vw;
  text-align: left;
  z-index: 2;
`;

const Label = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 1vw;
  position: relative;
  width: 100%;
  height: 100%;
  margin-top: 0.5vw;
  margin-bottom: 6.5vw;
  gap: 1vw;
`;

const Search = styled.input`
  width: 14.5vw;
  border-radius: 0.6vw;
  border: 0.15vw solid black;
  margin: 0.3vw 0 0 0;
  min-height: 3vw;
  background: url(${ActionIcons.search}) no-repeat left center;
  background-origin: content-box;
  padding: 0.5vw 1vw;
  background-size: contain;
  text-align: right;
  font-size: 0.8vw;
  &:disabled {
    background-color: #d5d5d5;
  }
`;

const Card = styled.div`
  padding: 0 0.6vw;
  margin: 0 0.3vw 0.3vw 0;
  justify-content: space-between;
  position: relative;
  margin-top: 0.2vw;
  min-height: 6vw;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  height: fit-content;
  justify-content: flex-start;
  gap: 1vw;
`;

const PopOverButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.4vw;
  font-size: 1vw;
  width: 14.5vw;
  min-width: max-content;
  border-color: transparent;
  background-color: white;
  &:hover {
    filter: brightness(0.8);
    cursor: pointer;
  }
`;

const Buttons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.3vw;
`;

const Want = styled.div`
  margin-top: 1vw;
  display: flex;
  align-items: center;
  gap: 0.2vw;
`;

const Divider = styled.div`
  border: 0.1vw dashed black;
  height: 0%;
  width: 100%;
  display: flex;
  margin: 0.8vw 0;
`;
