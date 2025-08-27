import styled from 'styled-components';

import { Inventory } from 'app/cache/inventory';
import { IconListButton, TextTooltip } from 'app/components/library';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { Account } from 'network/shapes/Account';
import { Item } from 'network/shapes/Item';
import { ChangeEvent, useState } from 'react';

interface Props {
  actions: { sendItemsTx: (items: Item[], amts: number[], account: Account) => void };
  data: {
    showSend: boolean;
    accounts: Account[];
    inventories: Inventory[];
  };
  utils: {
    setShowSend: (show: boolean) => void;
  };
}

export const Send = (props: Props) => {
  const { actions, data, utils } = props;
  const { showSend, accounts } = data;
  const { setShowSend } = utils;
  const { sendItemsTx } = actions;

  const [amt, setAmt] = useState<number>(1);

  const getSendTooltip = (item: Item) => {
    const tooltip = [`Send ${item.name} to another account.`];
    return tooltip;
  };

  // adjust and clean the Want amounts in the trade offer in respoonse to a form change
  const updateItemAmt = (event: ChangeEvent<HTMLInputElement>, inventory: Inventory) => {
    const quantityStr = event.target.value.replace(/[^\d.]/g, '');
    const rawQuantity = parseInt(quantityStr.replaceAll(',', '') || '0');
    const min = 0;
    const max = inventory.balance;
    const amt = Math.max(min, Math.min(max, rawQuantity));

    setAmt(amt);
  };

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
      'SEND'
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
