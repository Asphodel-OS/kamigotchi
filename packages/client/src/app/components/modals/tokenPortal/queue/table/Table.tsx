import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Configs } from 'app/cache/config/portal';
import { PortalReceipt } from 'clients/kamiden/proto';
import { EntityID } from 'engine/recs';
import { formatEntityID } from 'engine/utils';
import { Account, Item } from 'network/shapes';
import { getResultWithdraw, getSwapRate } from '../../utils';
import { BodyMine } from './Body/BodyMine';
import { BodyOthers } from './Body/BodyOthers';
import { Filter, Sort } from './constants';
import { Footer } from './Footer';
import { Header } from './Header';

export const Table = ({
  actions,
  data,
  utils,
}: {
  actions: {
    claim: (receiptID: PortalReceipt) => Promise<void>;
    cancel: (receiptID: PortalReceipt) => Promise<void>;
  };
  data: {
    myReceipts: PortalReceipt[];
    othersReceipts: PortalReceipt[];
    config: Configs;
    account: Account;
  };
  utils: {
    getItemByIndex: (index: number) => Item;
    getAccountByID: (id: EntityID) => Account;
  };
}) => {
  const { myReceipts, othersReceipts, config, account } = data;
  const { getAccountByID } = utils;

  const [filtered, setFiltered] = useState<PortalReceipt[]>([]);
  const [sort, setSort] = useState<Sort>({ key: 'Created', reverse: true });
  const [sorted, setSorted] = useState<PortalReceipt[]>([]);
  const [mode, setMode] = useState<Filter>('MINE');

  /////////////////
  // SUBSCRIPTIONS

  // determine which receipts get passed in based on the
  useEffect(() => {
    if (mode === 'MINE') setFiltered(myReceipts);
    else setFiltered(othersReceipts);
  }, [mode, myReceipts, othersReceipts]);

  // sort the receipts if the list of receipts changes
  useEffect(() => {
    const temp = [...filtered];
    const flip = sort.reverse ? -1 : 1;
    let sortedList: PortalReceipt[] = [];

    if (sort.key === 'Amount') {
      sortedList = temp.sort((a, b) => {
        const aAmt = Number(a.TokenAmt);
        const bAmt = Number(b.TokenAmt);
        return (aAmt - bAmt) * flip;
      });
    } else if (sort.key === 'Status') {
      sortedList = temp.sort((a, b) => {
        const withdrawalDiff = compareBools(!a.IsWithdrawal, !b.IsWithdrawal);
        if (withdrawalDiff !== 0) return withdrawalDiff * flip;

        const canceledDiff = compareBools(a.IsCanceled, b.IsCanceled);
        if (canceledDiff !== 0) return canceledDiff * flip;

        const claimedDiff = compareBools(a.IsClaimed, b.IsClaimed);
        if (claimedDiff !== 0) return claimedDiff * flip;

        // compare based on end times if no status differences
        const aEndTs = Number(a.Timestamp) + config.delay;
        const bEndTs = Number(b.Timestamp) + config.delay;
        return (bEndTs - aEndTs) * flip;
      });
    } else if (sort.key === 'Account') {
      sortedList = temp.sort((a, b) => {
        const aID = formatEntityID(BigInt(a.AccountID)) as EntityID;
        const bID = formatEntityID(BigInt(b.AccountID)) as EntityID;
        const aName = getAccountByID(aID)?.name?.toLowerCase() ?? '';
        const bName = getAccountByID(bID)?.name?.toLowerCase() ?? '';
        return bName.localeCompare(aName) * flip;
      });
    } else if (sort.key === 'Type') {
      sortedList = temp.sort((a, b) => compareBools(a.IsWithdrawal, b.IsWithdrawal) * flip);
    } else if (sort.key === 'Created') {
      sortedList = temp.sort((a, b) => (Number(a.Timestamp) - Number(b.Timestamp)) * flip);
    }

    setSorted(sortedList);
  }, [filtered, sort, config, utils]);

  /////////////////
  // GETTERS

  // compares two booleans
  const compareBools = (a: boolean, b: boolean) => {
    if (a === b) return 0;
    return a ? -1 : 1;
  };

  const getTokenConversion = (receipt: PortalReceipt) => {
    const item = utils.getItemByIndex(receipt.ItemIndex);
    const scale = item?.token?.scale ?? 0;
    let converted = 0;
    if (!receipt.IsWithdrawal) {
      converted = Number(Number(receipt.ItemAmt).toFixed(scale));
    } else {
      converted = getResultWithdraw(config, Number(receipt.ItemAmt));
    }
    const rate = item ? getSwapRate(item) : 1;
    return rate ? converted / rate : 0;
  };

  /////////////////
  // DISPLAY

  return (
    <Container>
      <Header
        columns={{
          Created: 4,
          Account: 4,
          Type: 4,
          Token: 4,
          Amount: 4,
          Status: 4,
          Actions: 3.5,
        }}
        data={{ mode }}
        state={{ sort, setSort }}
      />
      <BodyMine
        actions={actions}
        data={{ receipts: sorted, config }}
        utils={{ ...utils, getTokenConversion }}
        state={{ visible: mode === 'MINE' }}
      />
      <BodyOthers
        data={{ receipts: sorted, config, account }}
        utils={{ ...utils, getTokenConversion }}
        state={{ visible: mode === 'OTHERS' }}
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
