import styled from 'styled-components';

import { Inventory } from 'app/cache/inventory';
import { IconListButton, IconListButtonOption, TextTooltip } from 'app/components/library';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { MUSU_INDEX } from 'constants/items';
import { items } from 'network/explorer/items';
import { Account } from 'network/shapes/Account';
import { Item, NullItem } from 'network/shapes/Item';
import { ChangeEvent, useMemo, useState } from 'react';
import { mode } from 'viem/chains';
import { LineItem } from '../trading/management/create/LineItem';

interface Props {
  actions: { sendItemsTx: (items: Item[], amts: number[], account: Account) => void };
  data: {
    showSend: boolean;
    accounts: Account[];
    inventory: Inventory[];
  };
  utils: {
    setShowSend: (show: boolean) => void;
    getInventoryBalance: (inventories: Inventory[], index: number) => number;
  };
}

export const Send = (props: Props) => {
  const { actions, data, utils } = props;
  const { showSend, accounts, inventory } = data;
  const { setShowSend, getInventoryBalance } = utils;
  const { sendItemsTx } = actions;

  const [amt, setAmt] = useState<number>(1);
  const [item, setItem] = useState<Item>(NullItem);

  const getSendTooltip = (item: Item) => {
    const tooltip = [`Send ${item.name} to another account.`];
    return tooltip;
  };

  // adjust and clean the Want amounts in the trade offer in respoonse to a form change
  const updateItemAmt = (event: ChangeEvent<HTMLInputElement>) => {
    const quantityStr = event.target.value.replace(/[^\d.]/g, '');
    const rawQuantity = parseInt(quantityStr.replaceAll(',', '') || '0');
    const min = 0;
    const max = getInventoryBalance(inventory, MUSU_INDEX);
    const amt = Math.max(min, Math.min(max, rawQuantity));

    setAmt(amt);
  };

  const getItemOptions = useMemo(
    () => (): IconListButtonOption[] => {
      /// for sells we have to check the inventory
      const filtered = inventory.filter((inv: Inventory) => {
        if (!inv || !inv.item) return false;
        const isTradeable = inv.item.is.tradeable;
        const hasBalance = inv.balance > 0;
        const unused = item !== inv.item;
        const notCurrency = inv.item.index !== MUSU_INDEX;
        return isTradeable && hasBalance && unused && notCurrency;
      });

      const sorted = filtered.sort((a, b) => a.item.name.localeCompare(b.item.name));

      return sorted.map((inv: Inventory) => {
        return {
          text: inv.item.name,
          image: inv.item.image,
          onClick: () => setItem(inv.item),
        };
      });
    },
    [mode, items.length, inventory.length]
  );

  const SendButton = (item: Item[], amts: number[]) => {
    const options = accounts.map((targetAcc) => ({
      text: `${targetAcc.name} (#${targetAcc.index})`,
      onClick: () => sendItemsTx(item, amts, targetAcc),
    }));

    return (
      <TextTooltip key='send-tooltip' text={getSendTooltip(item[0])}>
        <IconListButton img={ArrowIcons.right} options={options} searchable scale={1.5} />
      </TextTooltip>
    );
  };

  return (
    <Container isVisible={showSend} key='send'>
      <Row>
        <LineItem
          options={getItemOptions()}
          selected={item}
          amt={amt}
          setAmt={(e) => updateItemAmt(e)}
          reverse
        />
      </Row>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex; ` : `display: none;`)}
  flex-flow: row wrap;
  justify-content: center;
  gap: 0.3vw;
  height: 30vh;
`;

const Row = styled.div`
  width: 100%;
  padding: 0.6vw;

  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
  gap: 0.6vw;
`;
