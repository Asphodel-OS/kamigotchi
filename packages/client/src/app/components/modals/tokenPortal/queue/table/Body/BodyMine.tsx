import styled from 'styled-components';

import { Configs } from 'app/cache/config/portal';
import { IconButton, TextTooltip } from 'app/components/library';
import { PlaceholderIcon } from 'assets/images/icons';
import { ActionIcons } from 'assets/images/icons/actions';
import { TokenIcons } from 'assets/images/tokens';
import { PortalReceipt } from 'clients/kamiden/proto';
import { EntityID } from 'engine/recs';
import { Account, Item } from 'network/shapes';
import { getCountdown } from 'utils/time';
import { openBaselineLink } from '../../../utils';

export const BodyMine = ({
  actions,
  data,
  utils,
  state,
}: {
  actions: {
    claim: (receiptID: PortalReceipt) => Promise<void>;
    cancel: (receiptID: PortalReceipt) => Promise<void>;
  };
  data: {
    receipts: PortalReceipt[];
    config: Configs;
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
  const { cancel, claim } = actions;
  const { receipts, config } = data;
  const { getItemByIndex, getTokenConversion } = utils;
  const { visible } = state;

  /////////////////
  // INTERPRETATION

  // determine whether a receipt is active
  const isActive = (receipt: PortalReceipt) => {
    return receipt.IsWithdrawal && !receipt.IsCanceled && !receipt.IsClaimed;
  };

  // check whether a Receipt is claimable
  const isClaimable = (receipt: PortalReceipt) => {
    const nowSec = Math.floor(Date.now() / 1000);
    return nowSec >= Number(receipt.Timestamp) + config.delay;
  };

  // get the tooltip for a Receipt Claim
  const getClaimTooltip = (receipt: PortalReceipt) => {
    if (!isClaimable(receipt)) return ['Not yet claimable'];
    else return ['Claim'];
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
            <Field width={5}>{r.IsWithdrawal ? 'Withdrawal' : 'Deposit'}</Field>
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
            <Field width={3.5}>
              <IconGroup visible={isActive(r)}>
                <TextTooltip text={getClaimTooltip(r)}>
                  <IconButton
                    img={PlaceholderIcon}
                    scale={1.5}
                    onClick={() => {
                      claim(r);
                    }}
                    disabled={!isClaimable(r) || r.IsCanceled || r.IsClaimed}
                  />
                </TextTooltip>
                <IconButton
                  img={ActionIcons.cancel}
                  scale={1.5}
                  onClick={() => {
                    cancel(r);
                  }}
                  disabled={r.IsCanceled || r.IsClaimed}
                />
              </IconGroup>
            </Field>
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
  display: flex;
  position: relative;
  width: 96%;
  height: 2.4vw;

  flex-flow: row nowrap;
  justify-content: space-around;
  align-items: center;
`;

const Field = styled.div<{ width: number }>`
  display: flex;
  gap: 0.6vw;
  width: ${({ width }) => width}vw;
  height: 100%;

  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  font-size: 0.6vw;
  user-select: none;
`;

const IconGroup = styled.div<{ visible?: boolean }>`
  display: ${({ visible = true }) => (visible ? 'flex' : 'none')};
  gap: 0.3vw;
  flex-flow: row nowrap;
  justify-content: center;
`;

const Icon = styled.img`
  width: 1.2vw;
  height: 1.2vw;
  &:hover {
    opacity: 0.8;
    cursor: pointer;
  }
`;
