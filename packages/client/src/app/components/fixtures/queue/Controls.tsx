import { useState } from 'react';
import styled from 'styled-components';
import { useBalance, useGasPrice, useWatchBlockNumber } from 'wagmi';

import { GasGauge, IconButton, Tooltip } from 'app/components/library';
import { useAccount } from 'app/stores';
import { triggerIcons } from 'assets/images/icons/triggers';
import { GasConstants, GasExponent } from 'constants/gas';
import { parseTokenBalance } from 'utils/numbers';

// NOTE: ACTUAL GAS EXPONENT HANDLED IN constants/gas.ts
// the precision to represent gas numbers at readable scale (e.g. mETH)
const READABILITY_PRECISION = 3;

interface Props {
  mode: number;
  setMode: Function;
}

export const Controls = (props: Props) => {
  const { mode, setMode } = props;
  const { account: kamiAccount } = useAccount();
  const iconMapping = [triggerIcons.eyeClosed, triggerIcons.eyeHalf, triggerIcons.eyeOpen];

  const [operatorGas, setOperatorGas] = useState<number>(0);
  const [gasPrice, setGasPrice] = useState<bigint>(0n);

  /////////////////
  // SUBSCRIPTION

  useWatchBlockNumber({
    onBlockNumber: (n) => {
      refetchOperatorGas();
      setOperatorGas(parseTokenBalance(operatorGasRaw?.value, GasExponent));

      // refresh gas price every 5 blocks
      if (n % 5n == 0n) {
        refetchGasPrice();
        setGasPrice((gasPriceData ?? 0n) / 10n ** BigInt(GasExponent)); // mETH
      }
    },
  });

  // Operator Eth Balance
  const { data: operatorGasRaw, refetch: refetchOperatorGas } = useBalance({
    address: kamiAccount.operatorAddress as `0x${string}`,
  });

  const { data: gasPriceData, refetch: refetchGasPrice } = useGasPrice();

  /////////////////
  // INTERACTION

  const toggleMode = () => {
    setMode((mode + 1) % 3);
  };

  /////////////////
  // INTERPRETATION

  // calculated the gas gauge level
  const calcGaugeSetting = (): number => {
    const level = operatorGas / GasConstants.Full;
    return Math.min(level, 1.0);
  };

  const getGaugeTooltip = () => {
    const tooltip = [`Gas Tank`, ''];
    let description = '';

    const balance = getScaledBalance();
    if (balance < GasConstants.Low) description = 'Tank STARVING T-T feed NAO';
    else if (balance < GasConstants.Quarter) description = 'Tank Hongry :| feed soon?';
    else if (balance < GasConstants.Half) description = 'Tank.. kinda hongry ._.';
    else if (balance < GasConstants.Full) description = 'Tank ok ^^ could eat';
    else description = 'Tank Full ^-^ Happy';
    return [...tooltip, description];
  };

  // get the tooltip
  const getBalanceTooltip = () => {
    const gas = operatorGas.toFixed(6);
    return ['1 ETH = 1000 milliETH', '', `${gas} ETH`];
  };

  // get gas balance converted to readability precision units
  const getScaledBalance = () => {
    return operatorGas * 10 ** READABILITY_PRECISION;
  };

  //////////////////
  // DISPLAY

  const PriceWarning = () => {
    if (gasPrice > 10n)
      return (
        <Tooltip
          text={[
            // `Gas price: ${gasPrice / 10n ** 3n} Gwei`,
            // '',
            'Warning:',
            '',
            'Spike in testnet gas prices',
            'Tank may drain faster',
          ]}
        >
          <WarningEmoji>⚠️</WarningEmoji>
        </Tooltip>
      );
    else return <></>;
  };

  //////////////////
  // CONTENT

  return (
    <Row>
      <RowPrefix>
        <Tooltip text={getGaugeTooltip()}>
          <GasGauge level={calcGaugeSetting()} />
        </Tooltip>
        <Tooltip text={getBalanceTooltip()}>
          <Text>{getScaledBalance().toFixed(2)}mETH</Text>
        </Tooltip>
        {PriceWarning()}
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

const WarningEmoji = styled.div`
  flex-grow: 2;

  margin-bottom: -0.3vw;
  margin-right: -0.2vw;

  text-align: center;
  font-size: 1.25vw;
`;
