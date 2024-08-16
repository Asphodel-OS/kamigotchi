import styled from 'styled-components';

import { IconListButton, Tooltip } from 'app/components/library';
import { Option } from 'app/components/library/base/buttons/IconListButton';
import { useVisibility } from 'app/stores';
import { Account, getAccessibleKamis } from 'network/shapes/Account';
import { Inventory, Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';

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
  const { modals, setModals } = useVisibility();

  /////////////////
  // DISPLAY

  const ItemIcon = (inv: Inventory) => {
    const item = inv.item;
    let options: Option[] = [];

    if (item.is.lootbox) {
      const count = Math.min(Math.max(inv.balance, 3), 10);
      options = [
        { text: 'Open', onClick: () => openLootbox(item, 1) },
        { text: `Open ${count}`, onClick: () => openLootbox(item, count) },
      ];
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

  if (inventories.length === 0) {
    return <EmptyText>Inventory is empty. Go get something.</EmptyText>;
  }

  return <Container key='grid'>{inventories.map((inv) => ItemIcon(inv))}</Container>;
};

const Container = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  gap: 0.3vw;
`;

const EmptyText = styled.div`
  color: #333;
  padding: 0.7vh 0vw;
  margin: 1.5vh;
  height: 100%;

  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
`;
