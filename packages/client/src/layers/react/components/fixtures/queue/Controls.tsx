import ErrorIcon from '@mui/icons-material/Error';
import styled from "styled-components";
import { useBalance } from "wagmi";

import PlaceHolderIcon from 'assets/images/icons/exit_native.png';
import { GasConstants } from 'constants/gas';
import { NetworkLayer } from "layers/network/types";
import { IconButton } from "layers/react/components/library/IconButton";
import { useKamiAccount } from 'layers/react/store/kamiAccount';
import { useComponentSettings } from 'layers/react/store/componentSettings';
import { playClick } from 'utils/sounds';
import { Tooltip } from '../../library/Tooltip';

interface Props {
  mode: 'collapsed' | 'expanded';
  setMode: Function;
  network: NetworkLayer;
}

export const Controls = (props: Props) => {
  const { details: accountDetails } = useKamiAccount();
  const { modals, setModals } = useComponentSettings();
  const { mode, setMode } = props;


  const { data: OperatorBal } = useBalance({
    address: accountDetails.operatorAddress as `0x${string}`,
    watch: true
  });

  const toggleMode = () => {
    setMode(mode === 'collapsed' ? 'expanded' : 'collapsed');
  }

  const clickGasIcon = () => {
    playClick();
    setModals({
      ...modals,
      operatorFund: !modals.operatorFund
    });
  }

  const ToggleButton = () => {
    const icon = PlaceHolderIcon;
    return (
      <IconButton
        id='toggle'
        onClick={() => toggleMode()}
        img={icon}
      />
    );
  }

  const GasWarning = () => {
    let warning = '';
    let color = '';
    if (Number(OperatorBal?.formatted) < GasConstants.Low) {
      color = 'red';
      warning = "Your Operator is STARVING. Click to top up NOW.";
    } else if (Number(OperatorBal?.formatted) < GasConstants.Quarter) {
      color = 'orange';
      warning = 'Your Operator is Hungry. Please feed it.'
    } else if (Number(OperatorBal?.formatted) < GasConstants.Half) {
      color = 'db9';
      warning = 'Your Operator could eat. Consider topping up on gas soon.'
    } else if (Number(OperatorBal?.formatted) < GasConstants.Full) {
      color = 'ddd';
      warning = 'Your Operator is chugging along happily. Nothing to see here ^.^'
    }

    return (
      <Tooltip text={[warning]}>
        <ErrorIcon
          style={{ color }}
          cursor='pointer'
          onClick={() => clickGasIcon()}
        />
      </Tooltip>
    )
  }

  return (
    <Row>
      <Symbolics>
        <GasWarning />
        <Text>TX Queue</Text>
      </Symbolics>
      <ToggleButton />
    </Row>
  );
}

const Row = styled.div`
  padding: .5vw;
  gap: .7vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
`;

const Symbolics = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: .2vw;
`;

const Text = styled.div`
  font-size: 1vw;
  color: #333;
  text-align: left;
  font-family: Pixel;
`;