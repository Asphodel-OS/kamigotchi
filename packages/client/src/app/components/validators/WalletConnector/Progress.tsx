import { TextTooltip } from 'app/components/library';
import styled from 'styled-components';
import { StatusCircle } from './StatusCircle';
import { Step } from './types';

export const Progress = ({
  statuses,
  step,
}: {
  statuses: {
    connected: boolean; // whether the wallet manager is connected
    networked: boolean; // whether manager is connected to the correct network
    authenticated: boolean; // whether logged in with privy
  };
  step: Step;
}) => {
  /////////////////
  // WALLET CONNECTION

  const getConnectionStatus = () => {
    if (statuses.connected) return 'FIXED';
    else if (step === 'CONNECTION') return 'FIXING';
    return 'WRONG';
  };

  const getConnectionTooltip = () => {
    if (statuses.connected) return ['Your wallet is connected!'];
    let tooltip = [
      'Kamigotchi is a fully onchain game hosted ',
      'on a blockchain. The network runs off an ',
      'Ethereum Virtual Machine (EVM) environment',
      'and requires a compatible wallet plugin.',
    ];

    if (step === 'CONNECTION') {
      tooltip = tooltip.concat([
        ``,
        `You'll be prompted to connect your wallet.`,
        `Press "Connect" to continue!`,
      ]);
    }
    return tooltip;
  };

  /////////////////
  // NETWORK

  const getNetworkStatus = () => {
    if (statuses.networked) return 'FIXED';
    else if (step === 'NETWORK') return 'FIXING';
    return 'WRONG';
  };

  const getNetworkTooltip = () => {
    if (statuses.networked) return [`You're connected to Yominet!`];
    let tooltip = [
      'Kamigotchi World is hosted on the Yominet network.',
      'You must connect to Yominet via your wallet plugin ',
      'to interact with the game.',
    ];

    if (step === 'NETWORK') {
      tooltip = tooltip.concat([
        ``,
        `If this is your first time playing, you'll also`,
        `be prompted to add Yominet to your wallet plugin.`,
        ``,
        `Press "Change Networks" to continue!`,
      ]);
    }
    return tooltip;
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
    let tooltip = [
      `Kamigotchi World supports headless transactions`,
      `for gameplay. This means you don't need to explicitly`,
      `sign each transaction with your wallet plugin.`,
      ``,
      `Instead you'll use a Privy Embedded Wallet,`,
      `which you can learn more about at docs.privy.io.`,
      `In game, we refer to this as your Account "Operator"`,
    ];

    if (step === 'AUTHENTICATION') {
      tooltip = tooltip.concat([
        ``,
        `You'll be prompted to log in with Privy.`,
        `If this is your first time playing, you'll also`,
        `be prompted to create an embedded wallet.`,
        ``,
        `Press "Login" to continue!`,
      ]);
    }
    return tooltip;
  };

  return (
    <Container>
      <Pairing>
        <TextTooltip text={getConnectionTooltip()} alignText='center'>
          <StatusCircle state={getConnectionStatus()} size={4.5} />
        </TextTooltip>
        <Text>Connection</Text>
      </Pairing>
      <Connector />
      <Pairing>
        <TextTooltip text={getNetworkTooltip()} alignText='center'>
          <StatusCircle state={getNetworkStatus()} size={4.5} />
        </TextTooltip>
        <Text>Network</Text>
      </Pairing>
      <Connector />
      <Pairing>
        <TextTooltip text={getAuthenticationTooltip()} alignText='center'>
          <StatusCircle state={getAuthenticationStatus()} size={4.5} />
        </TextTooltip>
        <Text>Authentication</Text>
      </Pairing>
    </Container>
  );
};

const Container = styled.div`
  position: relative;

  height: 9em;

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
`;

const Pairing = styled.div`
  height: 7.5em;
  gap: 0.6em;
  width: 25%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  user-select: none;
`;

const Text = styled.div`
  color: #333;
  font-size: 0.9em;
  text-align: center;
`;

const Connector = styled.div`
  width: 3em;
  border-top: 0.6em dotted gray;
`;
