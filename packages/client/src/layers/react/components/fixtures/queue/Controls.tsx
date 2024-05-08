import { useState } from 'react';
import styled from 'styled-components';
import { formatEther } from 'viem';
import { useBalance, useWatchBlockNumber } from 'wagmi';

import { triggerIcons } from 'assets/images/icons/triggers';
import { GasConstants } from 'constants/gas';
import { NetworkLayer } from 'layers/network';
import { GasGauge, IconButton, Tooltip } from 'layers/react/components/library';
import { useAccount } from 'layers/react/store';
import { parseTokenBalance } from 'utils/balances';

interface Props {
  mode: number;
  setMode: Function;
  network: NetworkLayer;
}

export const Controls = (props: Props) => {
  const { mode, setMode } = props;
  const { account: kamiAccount } = useAccount();
  const iconMapping = [triggerIcons.eyeClosed, triggerIcons.eyeHalf, triggerIcons.eyeOpen];

  const [burnerGasBalance, setBurnerGasBalance] = useState<number>(0);

  /////////////////
  // SUBSCRIPTION

  useWatchBlockNumber({
    onBlockNumber: (n) => {
      refetchOperatorBalance();
      setBurnerGasBalance(parseTokenBalance(operatorBalance?.value, operatorBalance?.decimals));
    },
  });

  // Operator Eth Balance
  const { data: operatorBalance, refetch: refetchOperatorBalance } = useBalance({
    address: kamiAccount.operatorAddress as `0x${string}`,
  });

  /////////////////
  // INTERACTION

  const toggleMode = () => {
    setMode((mode + 1) % 3);
  };

  /////////////////
  // INTERPRETATION

  const getGaugeTooltip = (balance: number) => {
    const tooltip = ['Operator Gas', ''];
    let description = 'Tank Full ^-^ Happy';

    if (balance < GasConstants.Low) description = 'Tank STARVING T-T feed NAO';
    else if (balance < GasConstants.Quarter) description = 'Tank Hongry ._. feed soon';
    else if (balance < GasConstants.Half) description = 'Tank ok ^^ could eat';
    return [...tooltip, description];
  };

  // calculated the gas gauge level
  const calcGaugeSetting = (balance: bigint = BigInt(0)): number => {
    const formatted = Number(formatEther(balance));
    const level = formatted / GasConstants.Full;
    return 100 * Math.min(level, 1.0);
  };

  //////////////////
  // CONTENT

  return (
    <Row>
      <RowPrefix>
        <Tooltip text={getGaugeTooltip(burnerGasBalance)}>
          <GasGauge level={calcGaugeSetting(operatorBalance?.value)} />
        </Tooltip>
        <Tooltip text={getGaugeTooltip(burnerGasBalance)}>
          <Text>{(burnerGasBalance * 1000).toFixed(2)}mΞ</Text>
        </Tooltip>
      </RowPrefix>
      <IconButton onClick={() => toggleMode()} img={iconMapping[mode]} />
    </Row>
  );
};

const Row = styled.div`
  padding: 0.3vw;
  padding-left: 0.5vw;
  gap: 0.7vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
`;

const RowPrefix = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.9vw;
`;

const Text = styled.div`
  font-size: 0.9vw;
  color: #333;
  text-align: left;
  font-family: Pixel;
`;
