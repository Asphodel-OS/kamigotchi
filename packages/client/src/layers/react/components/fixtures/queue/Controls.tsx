import { useState } from 'react';
import styled from 'styled-components';
import { formatEther } from 'viem';
import { useBalance, useWatchBlockNumber } from 'wagmi';

import { triggerIcons } from 'assets/images/icons/triggers';
import { GasConstants } from 'constants/gas';
import { GasGauge, IconButton, Tooltip } from 'layers/react/components/library';
import { useAccount } from 'layers/react/store';
import { parseTokenBalance } from 'utils/balances';

interface Props {
  mode: number;
  setMode: Function;
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

  // calculated the gas gauge level
  const calcGaugeSetting = (balance: bigint = BigInt(0)): number => {
    const formatted = Number(formatEther(balance));
    const level = formatted / GasConstants.Full;
    return Math.min(level, 1.0);
  };

  const getGaugeTooltip = (balance: number) => {
    const tooltip = ['Gas Tank', ''];
    let description = '';

    if (balance < GasConstants.Low) description = 'Tank STARVING T-T feed NAO';
    else if (balance < GasConstants.Quarter) description = 'Tank Hongry :| feed soon?';
    else if (balance < GasConstants.Half) description = 'Tank.. kinda hongry ._.';
    else if (balance < GasConstants.Full) description = 'Tank ok ^^ could eat';
    else description = 'Tank Full ^-^ Happy';
    return [...tooltip, description];
  };

  const getBalanceTooltip = (balance: number) => {
    const eth = balance.toFixed(5);
    return ['1 ETH = 1000 milliETH', '', `${eth}Ξ`];
  };

  //////////////////
  // CONTENT

  return (
    <Row>
      <RowPrefix>
        <Tooltip text={getGaugeTooltip(burnerGasBalance)}>
          <GasGauge level={calcGaugeSetting(operatorBalance?.value)} />
        </Tooltip>
        <Tooltip text={getBalanceTooltip(burnerGasBalance)}>
          <Text>{(burnerGasBalance * 1000).toFixed(2)}mETH</Text>
        </Tooltip>
      </RowPrefix>
      <IconButton onClick={() => toggleMode()} img={iconMapping[mode]} />
    </Row>
  );
};

const Row = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
  justify-content: space-between;
`;

const RowPrefix = styled.div`
  border-left: 0.15vw solid #333;
  border-bottom: 0.15vw solid #333;
  border-radius: 0 0 0 0.4vw;
  margin 0.2vw;
  padding: 0.3vw;
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
  gap: 0.6vw;
`;

const Text = styled.div`
  color: #333;
  padding-bottom: 0.09vw;
  text-align: left;
  font-family: Pixel;
  font-size: 0.75vw;
`;
