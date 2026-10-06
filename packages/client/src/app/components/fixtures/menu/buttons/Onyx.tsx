import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { formatEther } from 'viem';
import { useBalance, useWatchBlockNumber } from 'wagmi';

import { ExpandableIconButton } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { useAccount, useTokens, useVisibility } from 'app/stores';
import { TokenIcons } from 'assets/images/tokens';
import { Tokens } from 'constants/tokens';
import { getComponentValue } from 'engine/recs';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { queryReceiptsByAccount } from 'network/shapes/Portal';

const BURN_ADDRESS = '0x000000000000000000000000000000000000dead';

// menu entry for the Token Portal: both portal tokens as an overlapping pair, extended with
// owner/operator wallet balances on hover. while a withdrawal is claimable it glows and
// peeks out on its own with a "Claim Ready!" badge
export const OnyxMenuButton = () => {
  const { network } = useLayers();
  const balances = useTokens((s) => s.balances);

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
  // account's receipts past its end time is claimable. re-checked each second to catch expiry
  useEffect(() => {
    const { world, components } = network;
    const check = () => {
      const accountEntity = queryAccountFromEmbedded(network);
      if (!accountEntity) return setClaimReady(false);
      const nowSec = Math.floor(Date.now() / 1000);
      const receipts = queryReceiptsByAccount(components, world.entities[accountEntity]);
      setClaimReady(
        receipts.some((receipt) => {
          const endTs = getComponentValue(components.TimeEnd, receipt)?.value;
          return endTs !== undefined && nowSec >= Number(endTs);
        })
      );
    };
    check();
    const timerId = setInterval(check, 1000);
    return () => clearInterval(timerId);
  }, [network]);

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
