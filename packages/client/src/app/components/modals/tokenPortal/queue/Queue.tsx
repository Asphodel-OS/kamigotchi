import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { IconButton } from 'app/components/library';
import { Account, Item, Receipt } from 'network/shapes';
import { playClick } from 'utils/sounds';
import { Table } from './table/Table';

type Mode = 'MINE' | 'ALL';

export const Queue = ({
  actions,
  data,
  state,
  isVisible,
}: {
  actions: {
    claim: (receiptID: Receipt) => Promise<void>;
    cancel: (receiptID: Receipt) => Promise<void>;
  };
  data: {
    account: Account;
    receipts: Receipt[];
  };
  state: {
    options: Item[];
    setOptions: (items: Item[]) => void;
  };
  isVisible: boolean;
}) => {
  const { account, receipts } = data;

  const [mode, setMode] = useState<Mode>('MINE');
  const [displayed, setDisplayed] = useState<Receipt[]>([]);

  // determine which receipts get passed in based on the
  useEffect(() => {
    if (mode === 'MINE') {
      const myReceipts = receipts.filter((r) => r.account?.index === account.index);
      setDisplayed(myReceipts);
    } else {
      setDisplayed([...receipts]);
    }
  }, [receipts.length, mode]);

  /////////////////
  // INTERACTION

  // toggle between depositing and withdrawing
  const toggleMode = () => {
    setMode(mode === 'MINE' ? 'ALL' : 'MINE');
    playClick();
  };

  /////////////////
  // DISPLAY

  return (
    <Container isVisible={isVisible}>
      <Table actions={actions} data={{ account, receipts: displayed }} state={state} />
      <IconButton text={`<${mode}>`} onClick={toggleMode} />
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  border-top: 0.15vw solid black;
  width: 100%;

  padding-bottom: 0.6vw;

  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  overflow-y: hidden;
`;
