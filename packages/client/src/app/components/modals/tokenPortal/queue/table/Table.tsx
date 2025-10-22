import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Configs } from 'app/cache/config/portal';
import { TokenPortal } from 'clients/kamiden/proto';
import { EntityID } from 'engine/recs';
import { Account, Item } from 'network/shapes';
import { getResultWithdraw, getSwapRate } from '../../utils';
import { Body } from './Body';
import { Filter, Sort } from './constants';
import { Footer } from './Footer';
import { Header } from './Header';

export const Table = ({
  actions,
  data,

  utils,
}: {
  actions: {
    claim: (receiptID: TokenPortal) => Promise<void>;
    cancel: (receiptID: TokenPortal) => Promise<void>;
  };
  data: {
    myReceipts: TokenPortal[];
    othersReceipts: TokenPortal[];
    config: Configs;
    selected: Item;
    account: Account;
  };
  utils: {
    getItemByIndex: (index: number) => Item;
    getAccountByID: (id: EntityID) => Account;
  };
}) => {
  const { myReceipts, othersReceipts, config, selected, account } = data;

  const [filtered, setFiltered] = useState<TokenPortal[]>([]);
  const [sort, setSort] = useState<Sort>({ key: 'Created', reverse: true });
  const [sorted, setSorted] = useState<TokenPortal[]>([]);
  const [mode, setMode] = useState<Filter>('MINE');

  /////////////////
  // SUBSCRIPTIONS

  // determine which receipts get passed in based on the
  useEffect(() => {
    if (mode === 'MINE') {
      setFiltered(myReceipts);
    } else {
      setFiltered(othersReceipts);
    }
  }, [myReceipts, mode, othersReceipts]);

  // sort the receipts if the list of receipts changes
  useEffect(() => {
    const flip = sort.reverse ? -1 : 1;
    let sortedList: TokenPortal[] = [];

    if (sort.key === 'Amount') {
      sortedList = [...filtered].sort(
        (a, b) => (getTokenConversion(a) - getTokenConversion(b)) * flip
      );
    } else if (sort.key === 'Status') {
      sortedList = [...filtered].sort((a, b) => {
        const withdrawalDiff = (Number(a.IsWithdrawal) - Number(b.IsWithdrawal)) * flip;
        if (withdrawalDiff !== 0) return withdrawalDiff;

        const canceledDiff = (Number(a.IsCanceled) - Number(b.IsCanceled)) * flip;
        if (canceledDiff !== 0) return canceledDiff;

        return (Number(a.IsClaimed) - Number(b.IsClaimed)) * flip;
      });
    } else if (sort.key === 'Type') {
      sortedList = [...filtered].sort(
        (a, b) => (Number(a.IsWithdrawal) - Number(b.IsWithdrawal)) * flip
      );
    } else {
      // date
      sortedList = [...filtered].sort((a, b) => (Number(a.Timestamp) - Number(b.Timestamp)) * flip);
    }

    setSorted(sortedList);
  }, [filtered, sort]);

  /////////////////
  // GETTERS

  const getTokenConversion = (receipt: TokenPortal) => {
    const scale = selected?.token?.scale ?? 0;
    let converted = 0;
    if (!receipt.IsWithdrawal) converted = Number(Number(receipt.ItemAmt).toFixed(scale));
    else converted = getResultWithdraw(config, Number(receipt.ItemAmt));
    return converted / getSwapRate(selected);
  };

  /////////////////
  // DISPLAY

  return (
    <Container>
      <Header
        columns={{
          Account: 4,
          Type: 4,
          Token: 4,
          Amount: 4,
          Created: 5,
          Status: 4,
          Actions: 3.5,
        }}
        data={{ mode }}
        state={{ sort, setSort }}
      />
      <Body
        actions={actions}
        data={{ receipts: sorted, config, mode, account }}
        utils={{ ...utils, getTokenConversion }}
      />
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
