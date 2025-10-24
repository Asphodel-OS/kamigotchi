import styled from 'styled-components';

import { Configs } from 'app/cache/config/portal';
import { IconButton, TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { PlaceholderIcon } from 'assets/images/icons';
import { ActionIcons } from 'assets/images/icons/actions';
import { TokenIcons } from 'assets/images/tokens';
import { TokenPortal } from 'clients/kamiden/proto';
import { EntityID } from 'engine/recs';
import { formatEntityID } from 'engine/utils';
import { Account, Item } from 'network/shapes';
import { playClick } from 'utils/sounds';
import { getCountdown } from 'utils/time';
import { openBaselineLink } from '../../utils';

export const Body = ({
  actions,
  data,
  utils,
}: {
  actions: {
    claim: (receiptID: TokenPortal) => Promise<void>;
    cancel: (receiptID: TokenPortal) => Promise<void>;
  };
  data: {
    receipts: TokenPortal[];
    config: Configs;
    mode: string;
    account: Account;
  };
  utils: {
    getItemByIndex: (index: number) => Item;
    getTokenConversion: (receipt: TokenPortal) => number;
    getAccountByID: (id: EntityID) => Account;
  };
}) => {
  const { cancel, claim } = actions;
  const { receipts, config, mode, account } = data;
  const { getItemByIndex, getTokenConversion, getAccountByID } = utils;

  const selectAccount = useSelected((s) => s.setAccount);
  const selectedAccount = useSelected((s) => s.accountIndex);
  const setModals = useVisibility((s) => s.setModals);
  const accountModalOpen = useVisibility((s) => s.modals.account);

  /////////////////
  // GETTERS

  const getAccount = (receipt: TokenPortal) => {
    const account = getAccountByID(formatEntityID(BigInt(receipt.AccountID)) as EntityID);
    return account;
  };

  /////////////////
  // INTERPRETATION

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

  // determine whether a receipt is active
  const isActive = (receipt: TokenPortal) => {
    return receipt.IsWithdrawal && !receipt.IsCanceled && !receipt.IsClaimed;
  };

  // check whether a Receipt is claimable
  const isClaimable = (receipt: TokenPortal) => {
    const nowSec = Math.floor(Date.now() / 1000);
    return nowSec >= Number(receipt.Timestamp) + config.delay;
  };

  // get the tooltip for a Receipt Claim
  const getClaimTooltip = (receipt: TokenPortal) => {
    if (!isClaimable(receipt)) return ['Not yet claimable'];
    else return ['Claim'];
  };

  // get the status text of a receipt
  const getStatus = (receipt: TokenPortal) => {
    if (!receipt.IsWithdrawal) return 'Complete';
    if (receipt.IsCanceled) return 'Canceled';
    if (receipt.IsClaimed) return 'Claimed';
    return getCountdown(Number(receipt.Timestamp) + config.delay);
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
    <Container>
      {receipts.map((r: TokenPortal, i: number) => {
        const item = getItemByIndex(r.ItemIndex as number);
        const itsPlayer = account.id === formatEntityID(BigInt(r.AccountID));
        if (itsPlayer && mode === 'OTHERS') return null;
        return (
          <Row key={i} style={{ backgroundColor: i % 2 === 0 ? '#f5f5f5' : 'white' }}>
            <TextTooltip text={[getDate(r.Timestamp, false)]}>
              <Field width={4}>{getDate(r.Timestamp, true)}</Field>
            </TextTooltip>
            {mode === 'OTHERS' && (
              <TextTooltip text={[getAccount(r).name]} alignText={'right'}>
                <Field width={4} onClick={() => onClickAccount(getAccount(r))}>
                  <Name>{getAccount(r).name}</Name>
                </Field>
              </TextTooltip>
            )}
            {mode === 'MINE' && (
              <Field width={5}>{r.IsWithdrawal ? 'Withdrawal' : 'Deposit'}</Field>
            )}
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
            {mode === 'MINE' && (
              <Field width={3.5}>
                {isActive(r) && (
                  <IconGroup>
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
                )}
              </Field>
            )}
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

  padding: 0.6vw 0;

  display: flex;
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

const IconGroup = styled.div`
  gap: 0.3vw;

  display: flex;
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

const Name = styled.div`
  width: 12ch;
  overflow: hidden;
  white-space: nowrap;
  margin-left: 2.3vw;
  text-overflow: ellipsis;
  cursor: pointer;
`;
