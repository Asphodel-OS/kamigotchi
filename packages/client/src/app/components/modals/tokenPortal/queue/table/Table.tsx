import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Account, Item, Receipt } from 'network/shapes';
import { Body } from './Body';
import { Filter, Sort } from './constants';
import { Footer } from './Footer';
import { Header } from './Header';

export const Table = ({
  actions,
  data,
  state,
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
}) => {
  const { account, receipts } = data;

  const [mode, setMode] = useState<Filter>('MINE');
  const [filtered, setFiltered] = useState<Receipt[]>([]);
  const [sort, setSort] = useState<Sort>({ key: 'Status', reverse: false });
  const [sorted, setSorted] = useState<Receipt[]>([]);

  // determine which receipts get passed in based on the
  useEffect(() => {
    if (mode === 'MINE') {
      const myReceipts = receipts.filter((r) => r.account?.index === account.index);
      setFiltered(myReceipts);
    } else {
      setFiltered([...receipts]);
    }
  }, [receipts.length, mode]);

  // sort the receipts if the list of receipts changes
  useEffect(() => {
    const flip = sort.reverse ? -1 : 1;
    if (sort.key === 'Amount') {
      const sorted = filtered.sort((a, b) => (a.amt - b.amt) * flip);
      setSorted(sorted);
    } else if (sort.key === 'Account') {
      const sorted = filtered.sort((a, b) => {
        const aName = a.account?.name.toLowerCase() ?? '';
        const bName = b.account?.name.toLowerCase() ?? '';
        if (aName > bName) return 1 * flip;
        if (aName < bName) return -1 * flip;
        return 0;
      });
      setSorted(sorted);
    } else if (sort.key === 'Status') {
      const sorted = filtered.sort((a, b) => (a.time.end - b.time.end) * flip);
      setSorted(sorted);
    }
  }, [filtered.length, sort]);

  /////////////////
  // DISPLAY

  return (
    <Container>
      <Header
        columns={{
          Account: 7.5,
          Token: 4.5,
          Amount: 6,
          Status: 6,
          Actions: 6,
        }}
        state={{ sort, setSort }}
      />
      <Body actions={actions} data={{ account, receipts: sorted }} />
      <Footer state={{ mode, setMode }} />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;

  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  overflow-y: auto;
`;
