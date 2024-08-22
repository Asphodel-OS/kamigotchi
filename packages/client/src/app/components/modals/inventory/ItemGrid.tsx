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
    feedAccount: (item: Item) => void;
    openLootbox: (item: Item, amount: number) => void;
  };
}

// get the row of consumable items to display in the player inventory
export const ItemGrid = (props: Props) => {
  const { account, inventories, actions } = props;
  const { feedKami, feedAccount, openLootbox } = actions;

  /////////////////
  // INTERPRETATION

  const getLootboxActions = (item: Item, bal: number): Option[] => {
    const count = Math.min(Math.max(bal, 2), 10);
    const options = [{ text: 'Open', onClick: () => openLootbox(item, 1) }];
    if (bal > 1) options.push({ text: `Open ${count}`, onClick: () => openLootbox(item, count) });
    return options;
  };

  /////////////////
  // DISPLAY

  const ItemIcon = (inv: Inventory) => {
    const item = inv.item;
    let options: Option[] = [];

    if (item.is.lootbox) {
      options = getLootboxActions(item, inv.balance);
    } else if (item.for && item.for === 'ACCOUNT') {
      options = [{ text: 'Consume', onClick: () => feedAccount(inv.item) }];
    } else if (item.for && item.for === 'KAMI') {
      let kamis = getAccessibleKamis(account);
      if (item.type === 'REVIVE') kamis = kamis.filter((kami) => kami.state === 'DEAD');
      if (item.type === 'FOOD') kamis = kamis.filter((kami) => kami.state !== 'DEAD');
      if (item.type === 'RENAME_POTION') kamis = kamis.filter((kami) => !kami.flags?.namable);
      options = kamis.map((kami) => ({ text: kami.name, onClick: () => feedKami(kami, inv.item) }));
    }

    return (
      <Tooltip key={item.index} text={[item.name, '', item.description ?? '']}>
        <IconListButton
          key={item.index}
          img={item.image}
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
  justify-content: flex-start;
  gap: 0.3vw;
`;
