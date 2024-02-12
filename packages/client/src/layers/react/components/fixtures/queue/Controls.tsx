import styled from 'styled-components';
import { useBalance } from 'wagmi';
import ErrorIcon from '@mui/icons-material/Error';

import { triggerIcons } from 'assets/images/icons/triggers';
import { GasConstants } from 'constants/gas';
import { NetworkLayer } from 'layers/network/types';
import { IconButton } from 'layers/react/components/library/IconButton';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { useAccount } from 'layers/react/store/account';
import { useVisibility } from 'layers/react/store/visibility';
import { playClick } from 'utils/sounds';

interface Props {
  mode: number;
  setMode: Function;
  network: NetworkLayer;
}

export const Controls = (props: Props) => {
  const { mode, setMode } = props;
  const { account: kamiAccount } = useAccount();
  const { modals, setModals } = useVisibility();

  const { data: OperatorBal } = useBalance({
    address: kamiAccount.operatorAddress as `0x${string}`,
    watch: true,
  });

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

  //////////////////
  // RENDERINGS

  // gas warning icon, becomes more prominent as gas is depleted
  const GasWarning = () => {
    let warning = '';
    let color = '';
    if (Number(OperatorBal?.formatted) < GasConstants.Low) {
      color = 'red';
      warning = 'Your Operator is STARVING. Click to top up NOW.';
    } else if (Number(OperatorBal?.formatted) < GasConstants.Quarter) {
      color = 'orange';
      warning = 'Your Operator is Hungry. Please feed it.';
    } else if (Number(OperatorBal?.formatted) < GasConstants.Half) {
      color = 'db9';
      warning = 'Your Operator could eat. Consider topping up on gas soon.';
    } else if (Number(OperatorBal?.formatted) < GasConstants.Full) {
      color = 'ddd';
      warning =
        'Your Operator is chugging along happily. Nothing to see here ^.^';
    }

    return (
      <Tooltip text={[warning]}>
        <ErrorIcon
          style={{ color }}
          cursor='pointer'
          onClick={() => clickGasIcon()}
        />
      </Tooltip>
    );
  };

  // button to toggle the modal between difference sizes
  const ToggleButton = () => {
    const iconMapping = [
      triggerIcons.eyeClosed,
      triggerIcons.eyeHalf,
      triggerIcons.eyeOpen,
    ];

    return (
      <IconButton
        id='toggle'
        onClick={() => toggleMode()}
        img={iconMapping[mode]}
      />
    );
  };

  return (
    <Row>
      <RowPrefix>
        <GasWarning />
        <Text>TX Queue</Text>
      </RowPrefix>
      <ToggleButton />
    </Row>
  );
};

const Row = styled.div`
  padding: 0.5vw;
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
