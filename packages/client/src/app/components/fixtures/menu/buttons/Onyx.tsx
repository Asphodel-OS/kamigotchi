import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { formatEther } from 'viem';
import { useBalance, useWatchBlockNumber } from 'wagmi';

import { ExpandableIconButton } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { useAccount, useTokens, useVisibility } from 'app/stores';
import { TokenIcons } from 'assets/images/tokens';
import { Tokens } from 'constants/tokens';
import { getComponentValue, hasComponent } from 'engine/recs';
import { queryReceiptsByAccount } from 'network/shapes/Portal';

const BURN_ADDRESS = '0x000000000000000000000000000000000000dead';

// menu entry for the Token Portal: both portal tokens as an overlapping pair, extended with
// owner/operator wallet balances on hover. while a withdrawal is claimable it glows and
// peeks out on its own with a "Claim Ready!" badge
export const OnyxMenuButton = () => {
  const { network } = useLayers();
  const balances = useTokens((s) => s.balances);

  const accountID = useAccount((s) => s.account.id);
  const operatorAddress = useAccount((s) => s.account.operatorAddress);
  const hasOperator = operatorAddress.toLowerCase() !== BURN_ADDRESS;
  const portalIsOpen = useVisibility((s) => s.modals.tokenPortal);
  const setModals = useVisibility((s) => s.setModals);

  const [claimReady, setClaimReady] = useState(false);

  /////////////////
  // BALANCES

  const ownerOnyx = balances.get(Tokens.ONYX.address)?.balance ?? 0;
  const ownerEth = balances.get(Tokens.ETH.address)?.balance ?? 0;

  // for the operator
  const { data: operatorBalance, refetch: refetchOperator } = useBalance({
    address: operatorAddress,
    query: { enabled: hasOperator },
  });
  useWatchBlockNumber({
    enabled: hasOperator,
    onBlockNumber: (block) => {
      if (block % 2n === 0n) refetchOperator(); // same cadence as TokenChecker
    },
  });
  const operatorEth = Number(formatEther(operatorBalance?.value ?? 0n));

  const rows = [
    { label: 'Owner', onyx: ownerOnyx, eth: ownerEth },
    { label: 'Operator', onyx: 0, eth: operatorEth },
  ];

  /////////////////
  // CLAIM READINESS

  // a withdrawal receipt lives on chain from withdraw until claim/cancel, so any of the
  // account's receipts past its end time is claimable. event driven rather than polled:
  // recomputed when a receipt is created/removed (OwnsWithdrawalID) or gets its end time
  // (TimeEnd, set right after), plus one timer for the next pending receipt's end time
  useEffect(() => {
    const { components } = network;
    const { OwnsWithdrawalID, TimeEnd } = components;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    let queued = false;

    const update = () => {
      clearTimeout(timerId);
      if (!accountID) return setClaimReady(false);

      const nowSec = Date.now() / 1000;
      const receipts = queryReceiptsByAccount(components, accountID);
      const endTimes = receipts
        .map((receipt) => getComponentValue(TimeEnd, receipt)?.value)
        .filter((endTs) => endTs !== undefined)
        .map(Number);
      setClaimReady(endTimes.some((endTs) => nowSec >= endTs));

      const nextEnd = Math.min(...endTimes.filter((endTs) => endTs > nowSec));
      if (Number.isFinite(nextEnd)) {
        // setTimeout overflows past ~24.8 days; a capped timer just re-arms on firing
        const delayMs = Math.min((nextEnd - nowSec) * 1000 + 250, 2 ** 31 - 1);
        timerId = setTimeout(update, delayMs);
      }
    };

    // updates arrive in bursts (initial sync, multi-component writes); recompute once per burst
    const queueUpdate = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        update();
      });
    };

    update();
    const receiptSub = OwnsWithdrawalID.update$.subscribe(queueUpdate);
    const endTimeSub = TimeEnd.update$.subscribe(({ entity }) => {
      if (hasComponent(OwnsWithdrawalID, entity)) queueUpdate(); // TimeEnd is shared with other entities
    });
    return () => {
      clearTimeout(timerId);
      receiptSub.unsubscribe();
      endTimeSub.unsubscribe();
    };
  }, [network, accountID]);

  const togglePortal = () => setModals({ tokenPortal: !portalIsOpen });

  /////////////////
  // DISPLAY

  return (
    <ExpandableIconButton
      img={[TokenIcons.onyx, TokenIcons.eth]}
      onClick={togglePortal}
      scale={4.5}
      scaleOrientation='vh'
      radius={0.9}
      extension={{
        isPeeking: claimReady,
        glow: claimReady,
        onClick: togglePortal,
        peek: <ClaimBadge>Claim Ready!</ClaimBadge>,
        content: (
          <Balances>
            {rows.map(({ label, onyx, eth }) => (
              <Row key={label}>
                <Label>{label}</Label>
                <Value>
                  <Icon src={TokenIcons.onyx} alt='$ONYX' title='$ONYX' />
                  {onyx.toFixed(2)}
                </Value>
                <Value>
                  <Icon src={TokenIcons.eth} alt='$ETH' title='$ETH' />
                  {eth.toFixed(4)}
                </Value>
              </Row>
            ))}
          </Balances>
        ),
      }}
    />
  );
};

/////////////////
// STYLES

const ClaimBadge = styled.div`
  padding: 0.4vh 0.6vw;
  border-radius: 0.6vh;
  background-color: #fff3c4;
  color: #b8860b;
  font-size: 1.5vh;
  font-weight: bold;
`;

const Balances = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  column-gap: 0.7vw;
  row-gap: 0.4vh;
  align-items: center;
  line-height: 1; /* default line-height made each row taller than its text, eating the vertical space */
`;

// rows flatten into the parent grid so every column lines up
const Row = styled.div`
  display: contents;
`;

const Label = styled.div`
  font-size: 1vh;
  color: #999;
  text-transform: uppercase;
`;

const Value = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.3vw;
  font-size: 1.3vh;
  font-variant-numeric: tabular-nums;
`;

const Icon = styled.img`
  width: 1.4vh;
  height: 1.4vh;
  image-rendering: pixelated;
`;
