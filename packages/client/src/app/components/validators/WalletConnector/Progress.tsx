import { Tooltip } from 'app/components/library';
import styled from 'styled-components';
import { StatusCircle } from './StatusCircle';
import { Step } from './types';

interface Props {
  statuses: {
    connected: boolean; // whether the wallet manager is connected
    networked: boolean; // whether manager is connected to the correct network
    authenticated: boolean; // whether logged in with privy
  };
  step: Step;
}

export const Progress = (props: Props) => {
  const { statuses, step } = props;

  /////////////////
  // WALLET CONNECTION

  const getConnectionStatus = () => {
    if (statuses.connected) return 'FIXED';
    else if (step === 'CONNECTION') return 'FIXING';
    return 'WRONG';
  };

  const getConnectionTooltip = () => {
    if (statuses.connected) return ['Your wallet is connected!'];
    else if (step === 'CONNECTION') {
      return ['Press Connect!', '', `You'll be prompted to connect your wallet.`];
    }
    return ['You must connect your injected wallet (e.g. Metamask) before continuing.'];
  };

  /////////////////
  // NETWORK

  const getNetworkStatus = () => {
    if (statuses.networked) return 'FIXED';
    else if (step === 'NETWORK') return 'FIXING';
    return 'WRONG';
  };

  const getNetworkTooltip = () => {
    if (statuses.networked) return ['Your wallet is connected to Yominet!'];
    else if (step === 'NETWORK') {
      return ['Press Change Networks!', '', `You'll be prompted to change your network.`];
    }
    return ['You must connect to Yominet before continuing.'];
  };

  /////////////////
  // PRIVY AUTHENTICATION

  const getAuthenticationStatus = () => {
    if (statuses.authenticated) return 'FIXED';
    else if (step === 'AUTHENTICATION') return 'FIXING';
    return 'WRONG';
  };

  const getAuthenticationTooltip = () => {
    if (statuses.authenticated) return [`You're authenticated!`];
    else if (step === 'AUTHENTICATION') {
      return ['Press Login!', '', `You'll be prompted to log in with Privy.`];
    }
    return ['You must authenticate your Privy account before continuing.'];
  };

  return (
    <Container>
      <Pairing>
        <Tooltip text={getConnectionTooltip()} alignText='center'>
          <StatusCircle state={getConnectionStatus()} size={4.5} />
        </Tooltip>
        <Text>Connection</Text>
      </Pairing>
      <DottedLines left={10.5} top={3.3} />
      <Pairing>
        <Tooltip text={getNetworkTooltip()} alignText='center'>
          <StatusCircle state={getNetworkStatus()} size={4.5} />
        </Tooltip>
        <Text>Network</Text>
      </Pairing>
      <DottedLines left={22.2} top={3.3} />
      <Pairing>
        <Tooltip text={getAuthenticationTooltip()} alignText='center'>
          <StatusCircle state={getAuthenticationStatus()} size={4.5} />
        </Tooltip>
        <Text>Authentication</Text>
      </Pairing>
    </Container>
  );
};

const Container = styled.div`
  position: relative;

  width: 36vw;
  height: 9vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
`;

const Pairing = styled.div`
  width: 100%;
  height: 7.5vw;
  gap: 0.6vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  user-select: none;
`;

const Text = styled.div`
  color: #333;
  font-size: 0.9vw;
  text-align: center;
`;

const DottedLines = styled.div<{ left: number; top: number }>`
  position: absolute;
  border-top: 0.6vw dotted gray;
  width: 3vw;
  left: ${({ left }) => left}vw;
  top: ${({ top }) => top}vw;
`;
