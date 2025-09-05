import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Inventory } from 'app/cache/inventory';
import { EmptyText, IconListButton, TextTooltip } from 'app/components/library';
import { ButtonListOption } from 'app/components/library/buttons';
import { Option } from 'app/components/library/buttons/IconListButton';
import { Account } from 'network/shapes/Account';
import { Allo } from 'network/shapes/Allo';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { DetailedEntity } from 'network/shapes/utils';
import { ItemGridTooltip } from './ItemGridTooltip';

const EMPTY_TEXT = ['Inventory is empty.', 'Be less poore..'];

// get the row of consumable items to display in the player inventory
export const ItemGrid = ({
  actions,
  data,
  utils,
}: {
  actions: {
    sendItemsTx: (items: Item[], amts: number[], account: Account) => void;
    useForAccount: (item: Item, amount: number) => void;
    useForKami: (kami: Kami, item: Item) => void;
  };
  data: {
    account: Account;
    accountEntity: EntityIndex;
    inventories: Inventory[];
    kamis: Kami[];
    sendView: boolean;
    setSendView: (show: boolean) => void;
  };
  utils: {
    displayRequirements: (item: Item) => string;
    getAccount: (entityIndex: EntityIndex) => Account;
    getEntityIndex: (entity: EntityID) => EntityIndex;
    getInventories: () => Inventory[];
    getInventoryBalance: (inventories: Inventory[], index: number) => number;
    getItem: (index: EntityIndex) => Item;
    getKamis: () => Kami[];
    meetsRequirements: (holder: Kami | Account, item: Item) => boolean;
    parseAllos: (allo: Allo[]) => DetailedEntity[];
    setSendView: (show: boolean) => void;
  };
}) => {
  const { sendView, account, inventories, kamis } = data;
  const { meetsRequirements } = utils;

  const [visible, setVisible] = useState(false);

  // hide ItemGrid when sendView is true
  useEffect(() => {
    const id = setTimeout(() => setVisible(!sendView), 300);
    return () => clearTimeout(id);
  }, [sendView]);

  /////////////////
  // INTERPRETATION

  const getItemActions = (item: Item, bal: number): Option[] => {
    if (item.for && item.for === 'KAMI') return getKamiOptions(item);
    else if (item.for && item.for === 'ACCOUNT') return getAccountOptions(item, bal);
    else return [];
  };

  const getKamiOptions = (item: Item): Option[] => {
    const available = kamis.filter((kami) => meetsRequirements(kami, item));
    return available.map((kami) => ({
      text: kami.name,
      onClick: () => actions.useForKami(kami, item),
    }));
  };

  const getAccountOptions = (item: Item, bal: number): Option[] => {
    if (!meetsRequirements(account, item)) return [];
    const useItem = (amt: number) => actions.useForAccount(item, amt);

    const options: ButtonListOption[] = [];
    const increments = [1, 3, 10, 33, 100, 333, 1000, 3333];
    increments.forEach((i) => {
      if (bal >= i) options.push({ text: `Use ${i}`, onClick: () => useItem(i) });
    });

    if (bal > 1) options.push({ text: 'Use All', onClick: () => useItem(bal) });

    return options;
  };

  // // get the list of kamis that a specific item can be used on
  // const getAvailableKamis = (item: Item): Kami[] => {
  //   let kamis2 = getAccessibleKamis(account, kamis);
  //   if (item.type === 'REVIVE') kamis2 = kamis2.filter((kami) => kami.state === 'DEAD');
  //   if (item.type === 'FOOD') kamis2 = kamis2.filter((kami) => kami.state !== 'DEAD');
  //   if (item.type === 'RENAME_POTION') kamis2 = kamis2.filter((kami) => !kami.flags?.namable);
  //   if (item.type === 'SKILL_RESET') kamis2 = kamis2.filter((kami) => kami.state !== 'DEAD');
  //   return kamis2;
  // };

  /////////////////
  // DISPLAY

  const ItemIcon = (inv: Inventory) => {
    const item = inv.item;
    const options = getItemActions(item, inv.balance);

    return (
      <ItemWrapper key={item.index}>
        <TextTooltip
          key={item.index}
          text={item.index ? [<ItemGridTooltip key={item.index} item={item} utils={utils} />] : []}
          maxWidth={25}
        >
          <IconListButton
            key={item.index}
            img={item.image}
            scale={4.8}
            balance={inv.balance}
            options={options}
            disabled={options.length == 0}
          />
        </TextTooltip>
      </ItemWrapper>
    );
  };

  return (
    <Container isVisible={visible} key='grid'>
      {inventories.length < 1 && <EmptyText text={EMPTY_TEXT} />}
      {inventories.map((inv) => ItemIcon(inv))}
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex; ` : `display: none;`)}
  flex-flow: row wrap;
  justify-content: center;
  gap: 0.3vw;
`;

const ItemWrapper = styled.div`
  position: relative;
`;
