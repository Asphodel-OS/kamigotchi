import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Inventory } from 'app/cache/inventory';
import { EmptyText, IconListButton } from 'app/components/library';
import { ButtonListOption } from 'app/components/library/buttons';
import { Option } from 'app/components/library/buttons/IconListButton';
import { Account } from 'network/shapes/Account';
import { Allo } from 'network/shapes/Allo';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { DetailedEntity } from 'network/shapes/utils';
import { Mode } from '../types';
import { ItemGridTooltip } from './ItemGridTooltip';

const EMPTY_TEXT = ['Inventory is empty.', 'Be less poore..'];

// get the row of consumable items to display in the player inventory
export const ItemGrid = ({
  actions,
  data,
  state,
  utils,
}: {
  actions: {
    useForAccount: (item: Item, amount: number) => void;
    useForKami: (kami: Kami, item: Item) => void;
  };
  data: {
    account: Account;
    accountEntity: EntityIndex;
    inventories: Inventory[];
    kamis: Kami[];
  };
  state: {
    mode: Mode;
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
  const { useForAccount, useForKami } = actions;
  const { account, inventories, kamis } = data;
  const { mode } = state;
  const { meetsRequirements } = utils;

  const [visible, setVisible] = useState(false);

  // hide ItemGrid when sendView is true
  useEffect(() => {
    const id = setTimeout(() => setVisible(mode === 'STOCK'), 200);
    return () => clearTimeout(id);
  }, [mode]);

  /////////////////
  // INTERPRETATION

  // get the usage options for a given item
  const getItemActions = (item: Item, bal: number): Option[] => {
    if (item.for && item.for === 'KAMI') return getKamiOptions(item);
    else if (item.for && item.for === 'ACCOUNT') return getAccountOptions(item, bal);
    else return [];
  };

  // get the list of options for Kami to use Item on
  const getKamiOptions = (item: Item): Option[] => {
    const available = kamis.filter((kami) => meetsRequirements(kami, item));
    return available.map((kami) => ({
      text: kami.name,
      onClick: () => useForKami(kami, item),
    }));
  };

  // get the list of quantity options for an Account to use an Item in batch
  const getAccountOptions = (item: Item, bal: number): Option[] => {
    if (!meetsRequirements(account, item)) return [];
    const useItem = (amt: number) => useForAccount(item, amt);

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
  // RENDER

  return (
    <Container isVisible={visible} key='grid'>
      {inventories.length < 1 && <EmptyText text={EMPTY_TEXT} />}
      {inventories.map((inv) => {
        const item = inv.item;
        const options = getItemActions(item, inv.balance);

        return (
          <ItemWrapper key={item.index}>
            <IconListButton
              key={item.index}
              img={item.image}
              scale={4.8}
              balance={inv.balance}
              options={options}
              disabled={options.length == 0}
              tooltipProps={{
                text: [<ItemGridTooltip key={item.index} item={item} utils={utils} />],
                maxWidth: 25,
              }}
            />
          </ItemWrapper>
        );
      })}
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex; ` : `display: none;`)}
  flex-flow: row wrap;
  justify-content: center;
  gap: 0.3vw;
  padding: 0.6vw;
`;

const ItemWrapper = styled.div`
  position: relative;
`;
