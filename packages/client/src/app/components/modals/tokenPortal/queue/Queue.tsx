import styled from 'styled-components';

import { Account, Item, Receipt } from 'network/shapes';
import { Table } from './table/Table';

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

  /////////////////
  // DISPLAY

  return (
    <Container isVisible={isVisible}>
      <Table actions={actions} data={{ account, receipts }} state={state} />
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
