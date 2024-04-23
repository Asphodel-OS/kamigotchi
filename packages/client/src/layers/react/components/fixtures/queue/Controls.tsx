import ErrorIcon from '@mui/icons-material/Error';
import styled from 'styled-components';
import { useBalance, useWatchBlockNumber } from 'wagmi';

import { triggerIcons } from 'assets/images/icons/triggers';
import { GasConstants } from 'constants/gas';
import { NetworkLayer } from 'layers/network';
import { IconButton, Tooltip } from 'layers/react/components/library/';
import { useAccount, useVisibility } from 'layers/react/store';
import { playClick } from 'utils/sounds';
import { formatUnits } from 'viem';

interface Props {
  mode: number;
  setMode: Function;
  network: NetworkLayer;
}

export const Controls = (props: Props) => {
  const { mode, setMode } = props;
  const { account: kamiAccount } = useAccount();
  const { modals, setModals } = useVisibility();
  const iconMapping = [triggerIcons.eyeClosed, triggerIcons.eyeHalf, triggerIcons.eyeOpen];

  /////////////////
  // SUBSCRIPTION

  useWatchBlockNumber({
    onBlockNumber: (n) => refetchOperatorBalance(),
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

  const clickGasIcon = () => {
    playClick();
    setModals({
      ...modals,
      operatorFund: !modals.operatorFund,
    });
  };

  /////////////////
  // INTERPRETATION

  // parses a wagmi FetchBalanceResult
  // TODO: boot this to utils
  const parseTokenBalance = (balance: bigint = BigInt(0), decimals: number = 18) => {
    const formatted = formatUnits(balance, decimals);
    return Number(formatted);
  };

  //////////////////
  // CONTENT

  // gas warning icon, becomes more prominent as gas is depleted
  const GasWarning = () => {
    const balance = parseTokenBalance(operatorBalance?.value, operatorBalance?.decimals);

    let warning = '';
    let color = '';
    if (balance < GasConstants.Low) {
      color = 'red';
      warning = 'Your Operator is STARVING. Click to top up NOW.';
    } else if (balance < GasConstants.Quarter) {
      color = 'orange';
      warning = 'Your Operator is Hungry. Please feed it.';
    } else if (balance < GasConstants.Half) {
      color = 'db9';
      warning = 'Your Operator could eat. Consider topping up on gas soon.';
    } else if (balance < GasConstants.Full) {
      color = 'ddd';
      warning = 'Your Operator is chugging along happily. Nothing to see here ^.^';
    }

    return (
      <Tooltip text={[warning]}>
        <ErrorIcon
          style={{ color, width: '1.8vw' }}
          cursor='pointer'
          onClick={() => clickGasIcon()}
        />
      </Tooltip>
    );
  };

  return (
    <Row>
      <RowPrefix>
        <GasWarning />
        <Text>TX Queue</Text>
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
  gap: 0.5vw;
`;

const Text = styled.div`
  font-size: 1vw;
  color: #333;
  text-align: left;
  font-family: Pixel;
`;
