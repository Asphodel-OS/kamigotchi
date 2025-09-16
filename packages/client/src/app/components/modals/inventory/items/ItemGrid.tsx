import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Inventory, cleanInventories } from 'app/cache/inventory';
import { EmptyText, IconListButton } from 'app/components/library';
import { ButtonListOption } from 'app/components/library/buttons';
import { Option } from 'app/components/library/buttons/IconListButton';
import { useVisibility } from 'app/stores';
import { Account, NullAccount } from 'network/shapes/Account';
import { Allo } from 'network/shapes/Allo';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { DetailedEntity } from 'network/shapes/utils';

import { CategoryFilter, ItemCategory, categorizeItem } from '../CategoryFilter';
import { ItemGridTooltip } from './ItemGridTooltip';
import { Mode } from '../types';
import { MUSU_INDEX } from 'constants/items';

const EMPTY_TEXT = ['Inventory is empty.', 'Be less poore..'];
const REFRESH_INTERVAL = 2000;

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
  const { account: propAccount, inventories: propInventories, kamis: propKamis } = data;
  const { mode } = state;
  const { meetsRequirements, getAccount, getInventories, getKamis } = utils;
  const { modals } = useVisibility();

  // State management combining both approaches
  const [visible, setVisible] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [account, setAccount] = useState<Account>(propAccount || NullAccount);
  const [inventories, setInventories] = useState<Inventory[]>(propInventories || []);
  const [filteredInventories, setFilteredInventories] = useState<Inventory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('All');
  const [kamis, setKamis] = useState<Kami[]>(propKamis || []);

  // hide ItemGrid when sendView is true
  useEffect(() => {
    const id = setTimeout(() => setVisible(mode === 'STOCK'), 200);
    return () => clearTimeout(id);
  }, [mode]);

  // Initialize data and set up refresh timer
  useEffect(() => {
    updateData();
    const refreshClock = () => setLastRefresh(Date.now());
    const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
    return () => clearInterval(timerId);
  }, []);

  // refresh data whenever the modal is opened
  useEffect(() => {
    if (!modals.inventory) return;
    updateData();
  }, [modals.inventory, lastRefresh, data.accountEntity]);

  // filter inventories by selected category
  useEffect(() => {
    const base = inventories.filter((inventory) => inventory.item.index !== MUSU_INDEX);
    if (selectedCategory === 'All') {
      setFilteredInventories(base);
    } else {
      const filtered = base.filter((inventory) => {
        const itemCategory = categorizeItem(inventory.item);
        return itemCategory === selectedCategory;
      });
      setFilteredInventories(filtered);
    }
  }, [inventories, selectedCategory]);

  // update the inventory, account and kami data
  const updateData = () => {
    const currentAccount = getAccount(data.accountEntity);
    setAccount(currentAccount);

    // get, clean, and set account inventories
    const rawInventories = getInventories() ?? [];
    const cleanedInventories = cleanInventories(rawInventories);
    setInventories(cleanedInventories);

    // get, and set account kamis
    setKamis(getKamis());
  };

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
      image: kami.image,
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

  // Helper function to render individual item icons
  const ItemIcon = (inv: Inventory) => {
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
          tooltip={{
            text: [<ItemGridTooltip key={item.index} item={item} utils={utils} />],
            maxWidth: 25,
          }}
        />
      </ItemWrapper>
    );
  };

  return (
    <Container isVisible={visible} key='grid'>
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <ItemsGrid>
        {filteredInventories.length < 1 && inventories.length < 1 && <EmptyText text={EMPTY_TEXT} />}
        {filteredInventories.length < 1 && inventories.length > 0 && (
          <EmptyText text={['No items in this category.', 'Try a different filter.']} />
        )}
        {filteredInventories.map((inv) => ItemIcon(inv))}
      </ItemsGrid>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex; ` : `display: none;`)}
  flex-direction: column;
  width: 100%;
`;

const ItemsGrid = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  gap: 0.3vw;
  padding: 0.6vw;
`;

const ItemWrapper = styled.div`
  position: relative;
`;
