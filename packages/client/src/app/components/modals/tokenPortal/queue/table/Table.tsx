import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Account, Item, Receipt } from 'network/shapes';
import { Body } from './Body';
import { Sort } from './constants';
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

  const [sorted, setSorted] = useState<Receipt[]>([]);
  const [sort, setSort] = useState<Sort>({ key: 'Status', reverse: false });

  // sort the receipts if the list of receipts changes
  useEffect(() => {
    const flip = sort.reverse ? -1 : 1;
    if (sort.key === 'Amount') {
      const sorted = receipts.sort((a, b) => (a.amt - b.amt) * flip);
      setSorted(sorted);
    } else if (sort.key === 'Account') {
      const sorted = receipts.sort((a, b) => {
        const aName = a.account?.name.toLowerCase() ?? '';
        const bName = b.account?.name.toLowerCase() ?? '';
        if (aName > bName) return 1 * flip;
        if (aName < bName) return -1 * flip;
        return 0;
      });
      setSorted(sorted);
    } else if (sort.key === 'Status') {
      const sorted = receipts.sort((a, b) => (a.time.end - b.time.end) * flip);
      setSorted(sorted);
    }
  }, [receipts, sort]);

  /////////////////
  // DISPLAY

  return (
    <Container>
      <Header state={{ sort, setSort }} />
      <Body actions={actions} data={{ account, receipts: sorted }} state={state} />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;

  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  overflow-y: hidden;
`;
