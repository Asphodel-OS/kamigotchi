import styled from 'styled-components';

import { IconButton, Text, TextTooltip } from 'app/components/library';
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

  const isClaimable = (receipt: Receipt) => {
    return Date.now() / 1000 > receipt.time.end;
  };

  /////////////////
  // DISPLAY

  return (
    <Container>
      {receipts.map((r: Receipt, i: number) => {
        return (
          <Row key={i} style={{ backgroundColor: i % 2 === 0 ? '#f5f5f5' : 'white' }}>
            <Column width={7.5}>
              <Text size={0.75} onClick={() => onClickAccount(r.account!)}>
                {getNameDisplay(r.account!)}
              </Text>
            </Column>
            <Column width={4.5}>
              <Icon src={r.item?.image ?? PlaceholderIcon} />
            </Column>
            <Column width={6}>{convertAmt(r.item!, r.amt)}</Column>
            <Column width={6}>{getCountdown(r.time.end)}</Column>
            <Column width={6}>
              <IconGroup>
                <TextTooltip text={isClaimable(r) ? ['Claim'] : ['Not yet claimable']}>
                  <IconButton
                    img={PlaceholderIcon}
                    scale={1.5}
                    onClick={() => claim(r)}
                    disabled={!isClaimable(r)}
                  />
                </TextTooltip>
                <TextTooltip text={['Cancel']}>
                  <IconButton img={PlaceholderIcon} scale={1.5} onClick={() => cancel(r)} />
                </TextTooltip>
              </IconGroup>
            </Column>
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
  height: 2.4vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
  align-items: center;
`;

const Column = styled.div<{ width: number }>`
  gap: 0.6vw;
  width: ${({ width }) => width}vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`;

const IconGroup = styled.div`
  gap: 0.3vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
`;

const Icon = styled.img`
  width: 1.2vw;
  height: 1.2vw;
`;
