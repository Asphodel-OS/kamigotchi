import {
  ConnectedWallet,
  getEmbeddedConnectedWallet,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';
import { switchChain } from '@wagmi/core';
import { ethers } from 'ethers';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Address } from 'viem';
import { useConnect, useAccount as useWagmiAccount } from 'wagmi';
import { isSafariOrIOS } from 'workers/sync/grpcTransport';

import { ActionButton, ValidatorWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { emptyAccountDetails, useNetwork, useAccount as usePlayerAccount, useVisibility } from 'app/stores';
import { getInjectedWallet } from 'app/utils';
import { wagmiConfig } from 'clients/wagmi';
import { DefaultChain } from 'constants/chains';
import { createNetworkInstance, updateNetworkLayer } from 'network/';
import { NameCache, OperatorCache, OwnerCache } from 'network/shapes/Account';
import { abbreviateAddress } from 'utils/address';
import { Progress } from './Progress';

// Detects network changes and populates network clients for inidividual addresses.
// The purpose of this modal is to warn the user when something is amiss.
//
// TERMINOLOGY:
//    injectedAddress (privy) = ownerAddress (kamiworld)
//    embeddedAddress (privy) = operatorAddress (kamiworld)
export const WalletConnecter: UIComponent = {
  id: 'WalletConnecter',
  // positioning controlled by validator wrapper
  Render: () => {
    const { network } = useLayers();
    const { address: wagmiAddress, chain, isConnected } = useWagmiAccount();
    const { connectors, connect } = useConnect();
    const { ready, authenticated, login, logout } = usePrivy();
    const { wallets, ready: walletsReady } = useWallets();

    const { apis, addAPI } = useNetwork();
    const { burnerAddress, setBurnerAddress, setSelectedAddress, setSigner } = useNetwork();
    const { validations, setValidations } = useNetwork();
    const { toggleModals, toggleFixtures } = useVisibility();
    const { validators, setValidators } = useVisibility();
    const bridgeFlowActive = useVisibility((s) => s.modals.bridge || s.bridgeProcessActive);
    const accountExists = usePlayerAccount((s) => s.validations.accountExists);
    const setPlayerAccount = usePlayerAccount((s) => s.setAccount);
    const setPlayerValidations = usePlayerAccount((s) => s.setValidations);

    const [isUpdating, setIsUpdating] = useState(false);
    const [state, setState] = useState('');
    const [chainMatches, setChainMatches] = useState(false);

    // update network settings/validations on relevant network updates
    useEffect(() => {
      if (!ready || !walletsReady) return;
      const chainMatches = chain?.id === DefaultChain.id;
      if (!isConnected) {
        setState('disconnected');
        setSelectedAddress('0x000000000000000000000000000000000000dEaD');
      } else if (!chainMatches) setState('wrongChain');
      else if (!authenticated) setState('unauthenticated');
      else updateNetworkSettings();

      if (!isEqual(validations, { authenticated, chainMatches })) {
        setValidations({ authenticated, chainMatches });
      }
    }, [ready, authenticated, isConnected, chain, wallets, walletsReady]);

    // check whether the connected chain is correct
    useEffect(() => {
      const isCorrectChain = chain?.id === DefaultChain.id;
      if (isCorrectChain != chainMatches) setChainMatches(isCorrectChain);
    }, [chain, isConnected]);

    // reset account state and query caches on logout so that re-login
    // with a different wallet triggers a fresh account lookup.
    // Guarded by bridgeFlowActive: bridge chain-switching can cause
    // transient auth blips on some wallets — nuking state mid-bridge
    // would cascade through validators and pop WalletConnector.
    useEffect(() => {
      if (bridgeFlowActive) return;
      if (!authenticated) {
        setPlayerAccount(emptyAccountDetails());
        setPlayerValidations({ accountChecked: false, accountExists: false, operatorMatches: false, operatorHasGas: true });
        OperatorCache.clear();
        NameCache.clear();
        OwnerCache.clear();
      }
    }, [authenticated, bridgeFlowActive]);

    // adjust visibility of windows based on above determination.
    // Gated by `ready` so the effect doesn't run before Privy initialises
    // (prevents a one-frame WalletConnector flash on login).
    // Uses store-mirrored `validations` for the actual decision — the one-
    // render-cycle delay acts as a natural debounce against transient
    // chain/auth blips that occur during bridge wallet-switching.
    useEffect(() => {
      if (!ready) return;
      if (bridgeFlowActive) return;
      if (
        validators.accountRegistrar &&
        !accountExists &&
        validations.authenticated &&
        validations.chainMatches
      )
        return;

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
    }, [
      ready,
      validations,
      bridgeFlowActive,
      validators.accountRegistrar,
      accountExists,
    ]);

    // force logout the user when certain conditions are met:
    useEffect(() => {
      // Bridge may temporarily alter connection state; avoid forced logout mid-bridge.
      if (bridgeFlowActive) return;
      if (!authenticated) return; // wait for privy authentication

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
    }, [
      isConnected,
      authenticated,
      wallets,
      wagmiAddress,
      bridgeFlowActive,
    ]);

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
      const provider = await injectedWallet.getEthereumProvider();
      setSigner(await new ethers.BrowserProvider(provider).getSigner());
      setIsUpdating(false);
    };

    // update the network store with the injected wallet's api
    const addNetworkAPI = async (wallet: ConnectedWallet) => {
      // const injectedAddress = wallet.address.toLowerCase();
      const injectedAddress = wallet.address as Address;
      if (!apis.has(injectedAddress)) {
        console.log(`Establishing APIs for ${abbreviateAddress(injectedAddress)}`);
        let provider;
        try {
          provider = await new ethers.BrowserProvider(await wallet.getEthereumProvider());
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
      // const embeddedAddress = wallet.address.toLowerCase();
      const embeddedAddress = wallet.address as Address;
      if (burnerAddress !== embeddedAddress) {
        console.log(`Updating base network ${abbreviateAddress(embeddedAddress)}`);
        const provider = await new ethers.BrowserProvider(await wallet.getEthereumProvider());
        await updateNetworkLayer(network, provider);
        setBurnerAddress(embeddedAddress);
      }
    };

    // NOTE: connect() fails silently if user has no connectors (connector[0] == null)
    // On desktop with extensions: use connectWallet() for direct wallet connection
    // On iOS/Safari: use login() which shows list walletList from privy config
    const handleClick = () => {
      if (state === 'disconnected') {
        if (!isSafariOrIOS() && connectors?.[0]) connect({ connector: connectors[0] });
        else login();
      } else if (state === 'wrongChain') {
        switchChain(wagmiConfig, { chainId: DefaultChain.id });
      } else if (state === 'unauthenticated') {
        login();
      }
    };

    /////////////////
    // INTERPRETATION

    // get the wallet labeled as 'embedded' from the list of privy ConnectedWallets
    const getEmbeddedWallet = (wallets: ConnectedWallet[]) => {
      return getEmbeddedConnectedWallet(wallets);
    };

    const getWarning = () => {
      if (state === 'disconnected') {
        if (isSafariOrIOS()) {
          return `Safari/iOS detected. Please open this site in MetaMask Mobile's browser.`;
        }
        return `Your wallet is currently disconnected.`;
      }
      if (state === 'wrongChain') return `You must connect to Yominet`;
      if (state === 'unauthenticated') return `You are currently logged out.`;
      return '';
    };

    const getCurrentStep = () => {
      if (state === 'disconnected') return 'CONNECTION';
      if (state === 'wrongChain') return 'NETWORK';
      return 'AUTHENTICATION';
    };

    const getButtonLabel = () => {
      if (state === 'disconnected') return 'Connect';
      if (state === 'wrongChain') return 'Change Networks';
      if (state === 'unauthenticated') return 'Login';
      return '';
    };

    /////////////////
    // RENDER

    return (
      <ValidatorWrapper
        id='wallet-connector'
        divName='walletConnector'
        title='Wallet Connector'
        errorPrimary={getWarning()}
      >
        <Container>
          <Progress
            statuses={{
              connected: isConnected,
              networked: chainMatches,
              authenticated: authenticated,
            }}
            step={getCurrentStep()}
          />
          <ActionButton onClick={handleClick} text={getButtonLabel()} size='large' />
        </Container>
      </ValidatorWrapper>
    );
  },
};

const Container = styled.div`
  height: 15vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
  align-items: center;
`;
