import { ExternalProvider } from '@ethersproject/providers';
import {
  ConnectedWallet,
  getEmbeddedConnectedWallet,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';
import { switchChain } from '@wagmi/core';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';
import { useAccount, useConnect } from 'wagmi';

import { ActionButton, ValidatorWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useNetwork, useVisibility } from 'app/stores';
import { wagmiConfig } from 'clients/wagmi';
import { DefaultChain } from 'constants/chains';
import { createNetworkInstance, updateNetworkLayer } from 'network/';
import { abbreviateAddress } from 'utils/address';

// Detects network changes and populates network clients for inidividual addresses.
// The purpose of this modal is to warn the user when something is amiss.
//
// TERMINOLOGY:
//    injectedAddress (privy) = ownerAddress (kamiworld)
//    embeddedAddress (privy) = operatorAddress (kamiworld)
export function registerWalletConnecter() {
  registerUIComponent(
    'WalletConnecter',
    {
      // positioning controlled by validator wrapper
      colStart: 0,
      colEnd: 0,
      rowStart: 0,
      rowEnd: 0,
    },
    (layers) => of(layers),
    (layers) => {
      const { network } = layers;
      const { address: wagmiAddress, chain, isConnected } = useAccount();
      const { connectors, connect } = useConnect();
      const { ready, authenticated, login, logout } = usePrivy();
      const { wallets, ready: walletsReady } = useWallets();

      const { apis, addAPI } = useNetwork();
      const { burnerAddress, setBurnerAddress, setSelectedAddress, setSigner } = useNetwork();
      const { validations, setValidations } = useNetwork();
      const { toggleModals, toggleFixtures } = useVisibility();
      const { validators, setValidators } = useVisibility();

      const [isUpdating, setIsUpdating] = useState(false);
      const [lastTick, setLastTick] = useState(Date.now());
      const [state, setState] = useState('');

      // ticking
      useEffect(() => {
        const updateTick = () => setLastTick(Date.now());
        const interval = setInterval(() => updateTick(), 1000);
        return () => clearInterval(interval);
      }, []);

      // update network settings/validations on relevant network updates
      useEffect(() => {
        // console.log({ walletsReady, wallets });
        if (!ready || !walletsReady) return;
        const chainMatches = chain?.id === DefaultChain.id;
        if (!isConnected) {
          setState('disconnected');
          setSelectedAddress('');
        } else if (!chainMatches) setState('wrongChain');
        else if (!authenticated) setState('unauthenticated');
        else updateNetworkSettings();

        if (!isEqual(validations, { authenticated, chainMatches })) {
          setValidations({ authenticated, chainMatches });
        }
      }, [ready, authenticated, isConnected, chain, wallets, walletsReady, lastTick]);

      // adjust visibility of windows based on above determination
      useEffect(() => {
        const isVisible = !validations.authenticated || !validations.chainMatches;
        if (isVisible) {
          toggleModals(false);
          toggleFixtures(false);
        }
        if (isVisible != validators.walletConnector) {
          setValidators({
            walletConnector: isVisible,
            accountRegistrar: false,
            operatorUpdater: false,
            gasHarasser: false,
          });
        }
      }, [validations]);

      // force logout the user when certain conditions are met:
      useEffect(() => {
        if (!authenticated) return;

        // when the injected wallet is disconnected
        if (!isConnected) {
          console.warn('Wallet disconnected. Logging out.');
          logout();
          return;
        }

        // when a wallet mismatch is detected between privy and wagmi
        const injectedWallet = getInjectedWallet(wallets);
        if (injectedWallet) {
          const injectedAddress = injectedWallet.address;
          if (injectedAddress !== wagmiAddress) {
            console.warn(`Change in injected wallet detected. Logging out.`);
            logout();
            return;
          }
        }
      }, [isConnected, authenticated, wallets, wagmiAddress]);

      /////////////////
      // ACTIONS

      // update the network settings for the given wallets
      // opt for localstorage private key if in development mode
      const updateNetworkSettings = async () => {
        const injectedWallet = getInjectedWallet(wallets);
        const embeddedWallet = getEmbeddedWallet(wallets);
        if (isUpdating || !injectedWallet || !embeddedWallet) return;

        setIsUpdating(true);
        await updateBaseNetwork(embeddedWallet);
        await addNetworkAPI(injectedWallet);
        setSigner((await injectedWallet.getEthersProvider()).getSigner());
        setIsUpdating(false);
      };

      // update the network store with the injected wallet's api
      const addNetworkAPI = async (wallet: ConnectedWallet) => {
        const injectedAddress = wallet.address.toLowerCase();
        if (!apis.has(injectedAddress)) {
          console.log(`Establishing APIs for ${abbreviateAddress(injectedAddress)}`);
          let provider;
          try {
            provider = (await wallet.getEthereumProvider()) as ExternalProvider;
          } catch (e) {
            console.log('Error getting injected provider', e);
          }
          const networkInstance = await createNetworkInstance(provider);
          const txQueue = network.createTxQueue(networkInstance);
          addAPI(injectedAddress, txQueue);
        }
        setSelectedAddress(injectedAddress);
      };

      // update the base network with the embedded wallet
      // TODO: properly dispose the old network layer
      const updateBaseNetwork = async (wallet: ConnectedWallet) => {
        const embeddedAddress = wallet.address.toLowerCase();
        if (burnerAddress !== embeddedAddress) {
          console.log(`Updating base network ${abbreviateAddress(embeddedAddress)}`);
          const provider = (await wallet.getEthereumProvider()) as ExternalProvider;
          await updateNetworkLayer(network, provider);
          setBurnerAddress(embeddedAddress);
        }
      };

      const handleClick = () => {
        if (state === 'disconnected') connect({ connector: connectors[0] });
        else if (state === 'wrongChain') switchChain(wagmiConfig, { chainId: DefaultChain.id });
        else if (state === 'unauthenticated') login();
      };

      /////////////////
      // INTERPRETATION

      // get the wallet labeled as 'injected' from the list of privy ConnectedWallets
      const getInjectedWallet = (wallets: ConnectedWallet[]) => {
        return wallets.find((w) => w.connectorType === 'injected');
      };

      // get the wallet labeled as 'embedded' from the list of privy ConnectedWallets
      const getEmbeddedWallet = (wallets: ConnectedWallet[]) => {
        return getEmbeddedConnectedWallet(wallets);
      };

      const getTitle = () => {
        if (state === 'disconnected') return 'Disconnected';
        if (state === 'wrongChain') return 'Wrong Network';
        if (state === 'unauthenticated') return 'Logged Out';
        return '';
      };

      const getWarning = () => {
        const chainName = chain?.name ?? 'wrong';
        if (state === 'disconnected') return `Your wallet is currently disconnected.`;
        if (state === 'wrongChain') return `You're currently connected to the ${chainName} network`;
        if (state === 'unauthenticated') return `You are currently logged out.`;
        return '';
      };

      const getDescription = () => {
        if (state === 'disconnected') return 'You must connect one to continue.';
        if (state === 'wrongChain') return `Please connect to ${DefaultChain.name} network.`;
        if (state === 'unauthenticated') return 'You must log in to continue.';
        return '';
      };

      const getButtonLabel = () => {
        if (state === 'disconnected') return 'Connect';
        if (state === 'wrongChain') return 'Change Networks';
        if (state === 'unauthenticated') return 'Log in';
        return '';
      };

      /////////////////
      // RENDER

      return (
        <ValidatorWrapper
          id='wallet-connector'
          divName='walletConnector'
          title={getTitle()}
          errorPrimary={getWarning()}
        >
          <Description>{getDescription()}</Description>
          <ActionButton onClick={handleClick} text={getButtonLabel()} />
        </ValidatorWrapper>
      );
    }
  );
}

const Description = styled.div`
  color: #333;
  padding: 0.9vw 0;
  font-size: 0.75vw;
  text-align: center;
`;
