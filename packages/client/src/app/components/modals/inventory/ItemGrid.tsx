import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { getAccessibleKamis } from 'app/cache/account';
import { cleanInventories, Inventory } from 'app/cache/inventory';
import { EmptyText, IconListButton, Tooltip } from 'app/components/library';
import { Option } from 'app/components/library/base/buttons/IconListButton';
import { useVisibility } from 'app/stores';
import { Account, NullAccount } from 'network/shapes/Account';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';

const EMPTY_TEXT = ['Inventory is empty.', 'Be less poore..'];
const REFRESH_INTERVAL = 2000;

interface Props {
  accountEntity: EntityIndex;
  actions: {
    useForAccount: (item: Item, amount: number) => void;
    useForKami: (kami: Kami, item: Item) => void;
  };
  utils: {
    meetsRequirements: (holder: Kami | Account, item: Item) => boolean;
    getAccount: () => Account;
    getInventories: () => Inventory[];
    getKamis: () => Kami[];
  };
}

// get the row of consumable items to display in the player inventory
export const ItemGrid = (props: Props) => {
  const { actions, utils, accountEntity } = props;
  const { getAccount, getInventories, getKamis } = utils;
  const { modals } = useVisibility();

  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [account, setAccount] = useState<Account>(NullAccount);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [kamis, setKamis] = useState<Kami[]>([]);

  // set timer
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
  }, [modals.inventory, lastRefresh, accountEntity]);

  // update the inventory, account and kami data
  const updateData = () => {
    const account = getAccount();
    setAccount(account);

    // get, clean, and set account inventories
    const rawInventories = getInventories() ?? [];
    const inventories = cleanInventories(rawInventories);
    setInventories(inventories);

    // get, and set account kamis
    const rawKamis = getKamis();
    setKamis(rawKamis);
  };

  /////////////////
  // INTERPRETATION

  const getItemActions = (item: Item, bal: number): Option[] => {
    if (item.for && item.for === 'KAMI') return getKamiActions(item);
    else if (item.for && item.for === 'ACCOUNT') return getAccountActions(item, bal);
    else return [];
  };

  const getKamiActions = (item: Item): Option[] => {
    const kamis = getKamis().filter((kami) => utils.meetsRequirements(kami, item));
    return kamis.map((kami) => ({
      text: kami.name,
      onClick: () => actions.useForKami(kami, item),
    }));
  };

  const getAccountActions = (item: Item, bal: number): Option[] => {
    if (!utils.meetsRequirements(account, item)) return [];
    const count = Math.min(Math.max(bal, 2), 10);
    const options = [{ text: 'Use', onClick: () => actions.useForAccount(item, 1) }];
    if (bal > 1) {
      options.push({ text: `Use ${count}`, onClick: () => actions.useForAccount(item, count) });
    }
    return options;
  };

  // get the list of kamis that a specific item can be used on
  const getAvailableKamis = (item: Item): Kami[] => {
    let kamis2 = getAccessibleKamis(account, kamis);
    if (item.type === 'REVIVE') kamis2 = kamis2.filter((kami) => kami.state === 'DEAD');
    if (item.type === 'FOOD') kamis2 = kamis2.filter((kami) => kami.state !== 'DEAD');
    if (item.type === 'RENAME_POTION') kamis2 = kamis2.filter((kami) => !kami.flags?.namable);
    if (item.type === 'SKILL_RESET') kamis2 = kamis2.filter((kami) => kami.state !== 'DEAD');
    return kamis2;
  };

  /////////////////
  // DISPLAY

  const ItemIcon = (inv: Inventory) => {
    const item = inv.item;
    const options = getItemActions(item, inv.balance);

    return (
      <Tooltip key={item.index} text={[item.name, '', item.description ?? '']}>
        <IconListButton
          key={item.index}
          img={item.image}
          scale={4.8}
          balance={inv.balance}
          options={options}
          disabled={options.length == 0}
        />
      </Tooltip>
    );
  };

  return (
    <Container key='grid'>
      {inventories.length < 1 && <EmptyText text={EMPTY_TEXT} />}
      {inventories.map((inv) => ItemIcon(inv))}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  gap: 0.3vw;
`;
