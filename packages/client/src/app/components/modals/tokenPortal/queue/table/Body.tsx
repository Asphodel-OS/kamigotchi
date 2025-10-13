import styled from 'styled-components';

import { IconButton, Text, TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { PlaceholderIcon } from 'assets/images/icons';
import { ActionIcons } from 'assets/images/icons/actions';
import { TokenIcons } from 'assets/images/tokens';
import { Account, Receipt } from 'network/shapes';
import { parseTokenBalance } from 'utils/numbers';
import { playClick } from 'utils/sounds';
import { getCountdown } from 'utils/time';
import { openBaselineLink } from '../../utils';

export const Body = ({
  actions,
  data,
}: {
  actions: {
    claim: (receiptID: Receipt) => Promise<void>;
    cancel: (receiptID: Receipt) => Promise<void>;
  };
  data: {
    account: Account;
    receipts: Receipt[];
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

  // get the display name for an Account
  const getNameDisplay = (owner: Account) => {
    if (owner.index === 0) return 'Unknown';
    if (owner.index === account.index) return 'You';

    const name = owner.name.toLowerCase();
    if (name.length > 12) return `${name.slice(0, 9)}...`;
    return name;
  };

  // check whether a Receipt is cancelable
  const isCancelable = (receipt: Receipt) => {
    const isYours = receipt.account?.index === account.index;
    return isYours;
  };

  // get the tooltip for a Receipt Cancel
  const getCancelTooltip = (receipt: Receipt) => {
    if (!isCancelable(receipt)) return ['Not yours'];
    else return ['Cancel'];
  };

  // check whether a Receipt is claimable
  const isClaimable = (receipt: Receipt) => {
    const isRipe = Date.now() / 1000 > receipt.time.end;
    const isYours = receipt.account?.index === account.index;
    return isRipe && isYours;
  };

  // get the tooltip for a Receipt Claim
  const getClaimTooltip = (receipt: Receipt) => {
    const isYours = receipt.account?.index === account.index;
    if (!isYours) return ['Not your Receipt'];
    const isRipe = Date.now() / 1000 > receipt.time.end;
    if (!isRipe) return ['Not yet claimable'];
    else return ['Claim'];
  };

  /////////////////
  // DISPLAY

  return (
    <Container>
      {receipts.map((r: Receipt, i: number) => {
        return (
          <Row key={i} style={{ backgroundColor: i % 2 === 0 ? '#f5f5f5' : 'white' }}>
            <Field width={7.5}>
              <TextTooltip text={[r.account?.name]}>
                <Text size={0.6} onClick={() => onClickAccount(r.account!)}>
                  {getNameDisplay(r.account!)}
                </Text>
              </TextTooltip>
            </Field>
            <Field width={4.5}>
              <TextTooltip text={['$ONYX']} alignText={'right'}>
                <Icon
                  src={TokenIcons.onyx}
                  onClick={() => openBaselineLink(r.item?.token?.address ?? '')}
                />
              </TextTooltip>
            </Field>
            <Field width={6}>{parseTokenBalance(BigInt(r.amt))}</Field>
            <Field width={6}>{getCountdown(r.time.end)}</Field>
            <Field width={6}>
              <IconGroup>
                <TextTooltip text={getClaimTooltip(r)}>
                  <IconButton
                    img={PlaceholderIcon}
                    scale={1.5}
                    onClick={() => claim(r)}
                    disabled={!isClaimable(r)}
                  />
                </TextTooltip>
                <TextTooltip text={getCancelTooltip(r)}>
                  <IconButton
                    img={ActionIcons.cancel}
                    scale={1.5}
                    onClick={() => cancel(r)}
                    disabled={!isCancelable(r)}
                  />
                </TextTooltip>
              </IconGroup>
            </Field>
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

  overflow-y: scroll;
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
  overflow-x: scroll;
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
