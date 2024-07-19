import styled from 'styled-components';

import { IconListButton, Tooltip } from 'app/components/library';
import { Option } from 'app/components/library/IconListButton';
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
  };
}

// get the row of consumable items to display in the player inventory
export const ItemGrid = (props: Props) => {
  const { account, inventories, actions } = props;
  const { feedKami, feedAccount } = actions;
  const { modals, setModals } = useVisibility();

  /////////////////
  // DISPLAY

  const ItemIcon = (inv: Inventory) => {
    const item = inv.item;
    let options: Option[] = [];

    if (item.is.lootbox) {
      options = [{ text: 'Open', onClick: () => setModals({ ...modals, lootboxes: true }) }];
    } else if (item.for && item.for.account) {
      options = [{ text: 'Consume', onClick: () => feedAccount(inv.item) }];
    } else if (item.for && item.for.kami) {
      let kamis = getAccessibleKamis(account);
      if (item.type === 'REVIVE') kamis = kamis.filter((kami) => kami.state === 'DEAD');
      if (item.type === 'FOOD') kamis = kamis.filter((kami) => kami.state !== 'DEAD');
      if (item.type === 'RENAME_POTION') kamis = kamis.filter((kami) => !kami.can.name);
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
