import styled from 'styled-components';

import { Configs } from 'app/cache/config/portal';
import { PortalReceipt } from 'clients/kamiden/proto';
import { EntityID } from 'engine/recs';
import { Account, Item } from 'network/shapes';
import { Table } from './table/Table';

export const Queue = ({
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
  /////////////////
  // DISPLAY

  return (
    <Container>
      <Table actions={actions} data={data} utils={utils} />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  display: flex;
  border: 0.12vw solid #ddd;
  border-radius: 0.6vw;
  width: 100%;

  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;

  overflow: hidden;
`;
