import { EntityIndex } from 'engine/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Inventory } from 'app/cache/inventory';
import { EmptyText, ItemTooltip } from 'app/components/library';
import { ButtonListOption, IconListButton } from 'app/components/library/buttons';
import { MUSU_INDEX, VIPP_INDEX } from 'constants/items';
import { Account } from 'network/shapes/Account';
import { Allo } from 'network/shapes/Allo';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { DetailedEntity } from 'network/shapes/utils';
import { Mode } from '../types';
import { UseAmountOption } from './UseAmountOption';

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
    meetsRequirements: (holder: Kami | Account, item: Item) => boolean;
    parseAllos: (allo: Allo[]) => DetailedEntity[];
  };
}) => {
  const { useForAccount, useForKami } = actions;
  const { account, inventories, kamis } = data;
  const { mode } = state;
  const { meetsRequirements } = utils;

  const [visible, setVisible] = useState(false);
  const [displayed, setDisplayed] = useState<Inventory[]>([]);

  // hide ItemGrid when sendView is true
  useEffect(() => {
    const id = setTimeout(() => setVisible(mode === 'STOCK'), 200);
    return () => clearTimeout(id);
  }, [mode]);

  // set displayed when inventory changes
  useEffect(() => {
    const filtered = inventories.filter((inv) => inv.item.index !== MUSU_INDEX);
    setDisplayed(filtered);
  }, [inventories]);

  /////////////////
  // INTERPRETATION

  // get the usage options for a given item
  const getItemActions = (item: Item, bal: number): ButtonListOption[] => {
    if (!item.for) return [];
    if (item.for === 'KAMI') return getKamiOptions(item);
    if (item.for === 'ACCOUNT') return getAccountOptions(item, bal);
    return [];
  };

  // get the list of options for Kami to use Item on
  const getKamiOptions = (item: Item): ButtonListOption[] => {
    const available = kamis.filter((kami) => meetsRequirements(kami, item));
    return available.map((kami) => ({
      text: kami.name,
      image: kami.image,
      onClick: () => useForKami(kami, item),
    }));
  };

  // Use All is reserved for VIPP - every other Account item uses the quantity row
  const getAccountOptions = (item: Item, bal: number): ButtonListOption[] => {
    if (bal < 2 || item.index !== VIPP_INDEX) return [];
    if (!meetsRequirements(account, item)) return [];
    return [{ text: 'Use All', onClick: () => useForAccount(item, bal) }];
  };

  // the batch-use quantity row, pinned above the options of an Account item
  const getQuantityRow = (item: Item, bal: number) => {
    if (item.for !== 'ACCOUNT' || bal < 1) return undefined;
    if (!meetsRequirements(account, item)) return undefined;
    return <UseAmountOption max={bal} onSubmit={(amt) => useForAccount(item, amt)} />;
  };

  /////////////////
  // RENDER

  return (
    <Container isVisible={visible} key='grid'>
      {displayed.length < 1 && <EmptyText text={EMPTY_TEXT} />}
      {displayed.map((inv) => {
        const item = inv.item;
        const options = getItemActions(item, inv.balance);
        const quantityRow = getQuantityRow(item, inv.balance);

        return (
          <ItemWrapper key={item.index}>
            <IconListButton
              key={item.index}
              img={item.image}
              scale={4.8}
              balance={inv.balance}
              options={options}
              topContent={quantityRow}
              disabled={(options.length == 0 && !quantityRow) || item.is.disabled}
              tooltip={{
                text: [<ItemTooltip key={item.index} item={item} utils={utils} />],
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
