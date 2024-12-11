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
    useForAccount: (item: Item, amount: number) => void;
    useForKami: (kami: Kami, item: Item) => void;
  };
  utils: {
    meetsRequirements: (holder: Kami | Account, item: Item) => boolean;
  };
}

// get the row of consumable items to display in the player inventory
export const ItemGrid = (props: Props) => {
  const { account, inventories, actions, utils } = props;

  /////////////////
  // INTERPRETATION

  const getActions = (item: Item, bal: number): Option[] => {
    if (item.for && item.for === 'KAMI') return getKamiActions(item);
    else if (item.for && item.for === 'ACCOUNT') return getAccountActions(item, bal);
    else return [];
  };

  const getKamiActions = (item: Item): Option[] => {
    const kamis = getAccessibleKamis(account).filter((kami) => utils.meetsRequirements(kami, item));
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
