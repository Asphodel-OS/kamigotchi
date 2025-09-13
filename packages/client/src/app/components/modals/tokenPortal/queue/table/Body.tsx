import styled from 'styled-components';

import { IconButton, Text } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { PlaceholderIcon } from 'assets/images/icons';
import { Account, Item, Receipt } from 'network/shapes';
import { playClick } from 'utils/sounds';
import { getCountdown } from 'utils/time';

export const Body = ({
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
  const { cancel, claim } = actions;
  const { account, receipts } = data;
  const selectAccount = useSelected((s) => s.setAccount);
  const selectedAccount = useSelected((s) => s.accountIndex);
  const setModals = useVisibility((s) => s.setModals);
  const accountModalOpen = useVisibility((s) => s.modals.account);

  /////////////////
  // INTERACTION

  // open the Account modal for the owner of the receipt
  const onClickAccount = (owner: Account) => {
    if (owner.index === 0) return;
    if (accountModalOpen) {
      if (selectedAccount !== owner.index) selectAccount(owner.index);
      else setModals({ account: false });
    } else {
      selectAccount(owner.index);
      setModals({ account: true, map: false, party: false });
    }
    playClick();
  };

  /////////////////
  // INTERPRETATION

  const convertAmt = (item: Item, amt: number) => {
    const scale = item.token?.scale ?? 0;
    return amt * 10 ** (scale - 18);
  };

  const getNameDisplay = (owner: Account) => {
    if (owner.index === 0) return 'Unknown';
    if (owner.index === account.index) return 'You';

    const name = owner.name.toLowerCase();
    if (name.length > 12) return `${owner.name.slice(0, 12)}...`;
    return name;
  };

  /////////////////
  // DISPLAY

  return (
    <Container>
      {receipts.map((receipt: Receipt, i: number) => {
        return (
          <Row key={i} style={{ backgroundColor: i % 2 === 0 ? '#f5f5f5' : 'white' }}>
            <Column>
              <Text size={0.75} onClick={() => onClickAccount(receipt.account!)}>
                {getNameDisplay(receipt.account!)}
              </Text>
            </Column>
            <Column>
              <Icon src={receipt.item?.image ?? PlaceholderIcon} />
            </Column>
            <Column>{convertAmt(receipt.item!, receipt.amt)}</Column>
            <Column>
              {Date.now() / 1000 > receipt.time.end ? (
                <IconButton text='Claim' onClick={() => claim(receipt)} />
              ) : (
                getCountdown(receipt.time.end)
              )}
            </Column>
            <IconButton img={PlaceholderIcon} scale={1.5} onClick={() => cancel(receipt)} />
          </Row>
        );
      })}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  max-height: 100%;
  width: 100%;

  padding-top: 0.6vw;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;

  overflow-y: scroll;
`;

const Row = styled.div`
  width: 96%;
  height: 3vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
  align-items: center;
`;

const Column = styled.div`
  gap: 0.6vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`;

const Icon = styled.img`
  width: 1.2vw;
  height: 1.2vw;
`;
