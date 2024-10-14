import styled from 'styled-components';

import { EmptyText, IconListButton, Tooltip } from 'app/components/library';
import { Option } from 'app/components/library/base/buttons/IconListButton';
import { Account, getAccessibleKamis } from 'network/shapes/Account';
import { Inventory, Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';

const EMPTY_TEXT = ['Inventory is empty.', 'Be less poore..'];

interface Props {
  account: Account;
  inventories: Inventory[];
  actions: {
    feedKami: (kami: Kami, item: Item) => void;
    reviveKami: (kami: Kami, item: Item) => void;
    renamePotionKami: (kami: Kami, item: Item) => void;
    t1ToT2Kami: (kami: Kami, item: Item) => void; // testnet function, for sending kami from t1 to t2
    feedAccount: (item: Item) => void;
    teleportAccount: (item: Item) => void;
    openLootbox: (item: Item, amount: number) => void;
  };
}

// get the row of consumable items to display in the player inventory
export const ItemGrid = (props: Props) => {
  const { account, inventories, actions } = props;

  /////////////////
  // INTERPRETATION

  const getActions = (item: Item, bal: number): Option[] => {
    if (item.type === 'LOOTBOX') return getLootboxActions(item, bal);
    else if (item.for && item.for === 'KAMI') return getKamiActions(item, bal);
    else if (item.for && item.for === 'ACCOUNT') return getAccountActions(item, bal);
    else return [];
  };

  const getAccountActions = (item: Item, bal: number): Option[] => {
    if (item.type === 'FOOD') {
      return [{ text: 'Eat (nom)', onClick: () => actions.feedAccount(item) }];
    } else if (item.type === 'TELEPORT') {
      return [{ text: 'Use', onClick: () => actions.teleportAccount(item) }];
    } else return []; // should not reach here
  };

  const getKamiActions = (item: Item, bal: number): Option[] => {
    const kamis = getAvailableKamis(item);

    let action: (kami: Kami) => void;
    if (item.type === 'FOOD') action = (kami) => actions.feedKami(kami, item);
    else if (item.type === 'REVIVE') action = (kami) => actions.reviveKami(kami, item);
    else if (item.type === 'RENAME_POTION') action = (kami) => actions.renamePotionKami(kami, item);
    else if (item.type === 'TRANSFERRER') action = (kami) => actions.t1ToT2Kami(kami, item);

    return kamis.map((kami) => ({ text: kami.name, onClick: () => action(kami) }));
  };

  const getAvailableKamis = (item: Item): Kami[] => {
    let kamis = getAccessibleKamis(account);
    if (item.type === 'REVIVE') kamis = kamis.filter((kami) => kami.state === 'DEAD');
    if (item.type === 'FOOD') kamis = kamis.filter((kami) => kami.state !== 'DEAD');
    if (item.type === 'RENAME_POTION') kamis = kamis.filter((kami) => !kami.flags?.namable);
    if (item.type === 'TRANSFERRER') kamis = kamis.filter((kami) => kami.state !== 'DEAD');
    return kamis;
  };

  const getLootboxActions = (item: Item, bal: number): Option[] => {
    const count = Math.min(Math.max(bal, 2), 10);
    const options = [{ text: 'Open', onClick: () => actions.openLootbox(item, 1) }];
    if (bal > 1)
      options.push({ text: `Open ${count}`, onClick: () => actions.openLootbox(item, count) });
    return options;
  };

  /////////////////
  // DISPLAY

  const ItemIcon = (inv: Inventory) => {
    const item = inv.item;
    const options = getActions(item, inv.balance);

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
