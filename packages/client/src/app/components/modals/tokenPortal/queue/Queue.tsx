import styled from 'styled-components';

import { Configs } from 'app/cache/config/portal';
import { PortalReceipt } from 'clients/kamiden/proto';
import { EntityID } from 'engine/recs';
import { Account, Item } from 'network/shapes';
import { Table } from './table/Table';

export const Queue = ({
  actions,
  data,

  isVisible,
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

  isVisible: boolean;
  utils: {
    getItemByIndex: (index: number) => Item;
    getAccountByID: (id: EntityID) => Account;
  };
}) => {
  /////////////////
  // DISPLAY

  return (
    <Container isVisible={isVisible}>
      <Table actions={actions} data={data} utils={utils} />
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  border-top: 0.15vw solid black;
  width: 100%;

  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  overflow-y: hidden;
`;
