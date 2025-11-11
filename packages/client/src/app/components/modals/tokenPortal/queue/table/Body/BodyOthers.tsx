import styled from 'styled-components';

import { Configs } from 'app/cache/config/portal';
import { TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { TokenIcons } from 'assets/images/tokens';
import { PortalReceipt } from 'clients/kamiden/proto';
import { EntityID } from 'engine/recs';
import { formatEntityID } from 'engine/utils';
import { Account, Item } from 'network/shapes';
import { playClick } from 'utils/sounds';
import { getCountdown } from 'utils/time';
import { openBaselineLink } from '../../../utils';

export const BodyOthers = ({
  data,
  utils,
  state,
}: {
  data: {
    receipts: PortalReceipt[];
    config: Configs;
    account: Account;
  };
  utils: {
    getItemByIndex: (index: number) => Item;
    getTokenConversion: (receipt: PortalReceipt) => number;
    getAccountByID: (id: EntityID) => Account;
  };
  state: {
    visible: boolean;
  };
}) => {
  const { receipts, config } = data;
  const { getItemByIndex, getTokenConversion, getAccountByID } = utils;
  const { visible } = state;

  const selectAccount = useSelected((s) => s.setAccount);
  const selectedAccount = useSelected((s) => s.accountIndex);
  const setModals = useVisibility((s) => s.setModals);
  const isAccountModalOpen = useVisibility((s) => s.modals.account);

  /////////////////
  // GETTERS

  const getAccount = (receipt: PortalReceipt) => {
    const account = getAccountByID(formatEntityID(BigInt(receipt.AccountID)) as EntityID);
    return account;
  };

  /////////////////
  // INTERPRETATION

  // open the Account modal for the owner of the receipt
  const onClickAccount = (owner: Account) => {
    if (owner.index === 0) return;
    if (isAccountModalOpen) {
      if (selectedAccount !== owner.index) selectAccount(owner.index);
      else setModals({ account: false });
    } else {
      selectAccount(owner.index);
      setModals({ account: true, map: false, party: false });
    }
    playClick();
  };

  // get the status text of a receipt
  const getStatus = (receipt: PortalReceipt) => {
    if (!receipt.IsWithdrawal) return 'Complete';
    if (receipt.IsCanceled) return 'Canceled';
    if (receipt.IsClaimed) return 'Claimed';

    const now = Math.floor(Date.now() / 1000);
    const endTs = Number(receipt.Timestamp) + config.delay;
    if (now > endTs) return 'Ready';

    return getCountdown(endTs);
  };

  // get the date string of a receipt
  const getDate = (timestamp: string, onlyDate: boolean) => {
    const date = new Date(Number(timestamp) * 1000);
    return onlyDate
      ? date.toLocaleDateString(navigator.language, { month: 'short', day: 'numeric' })
      : date.toLocaleString(navigator.language, {
          hour12: false,
        });
  };

  /////////////////
  // DISPLAY

  return (
    <Container visible={visible}>
      {receipts.map((r: PortalReceipt, i: number) => {
        const item = getItemByIndex(r.ItemIndex as number);
        return (
          <Row key={i} style={{ backgroundColor: i % 2 === 0 ? '#f5f5f5' : 'white' }}>
            <TextTooltip text={[getDate(r.Timestamp, false)]}>
              <Field width={4}>{getDate(r.Timestamp, true)}</Field>
            </TextTooltip>
            <TextTooltip text={[getAccount(r).name]} alignText={'right'}>
              <Field width={4} onClick={() => onClickAccount(getAccount(r))}>
                <Name>{getAccount(r).name}</Name>
              </Field>
            </TextTooltip>
            <Field width={2}>
              <TextTooltip text={['$ONYX']} alignText={'right'}>
                <Icon
                  src={TokenIcons.onyx}
                  onClick={() => openBaselineLink(item?.token?.address ?? '')}
                />
              </TextTooltip>
            </Field>
            <Field width={3.5}>{getTokenConversion(r)}</Field>
            <Field width={4}>{getStatus(r)}</Field>
          </Row>
        );
      })}
    </Container>
  );
};

const Container = styled.div<{ visible?: boolean }>`
  display: ${({ visible = true }) => (visible ? 'flex' : 'none')};
  position: relative;
  max-height: 100%;
  width: 100%;

  padding: 0.6vw 0;

  flex-flow: column nowrap;
  align-items: center;
`;

const Row = styled.div`
  position: relative;
  width: 96%;
  height: 2.4vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
  align-items: center;
`;

const Field = styled.div<{ width: number }>`
  gap: 0.6vw;
  width: ${({ width }) => width}vw;
  height: 100%;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  font-size: 0.6vw;
  user-select: none;
`;

const Icon = styled.img`
  width: 1.2vw;
  height: 1.2vw;

  &:hover {
    opacity: 0.8;
    cursor: pointer;
  }
`;

const Name = styled.div`
  width: 12ch;
  overflow: hidden;
  white-space: nowrap;
  margin-left: 2.3vw;
  text-overflow: ellipsis;
  cursor: pointer;
`;
