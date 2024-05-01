import { ExternalProvider } from '@ethersproject/providers';
import { ConnectedWallet, usePrivy, useWallets } from '@privy-io/react-auth';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';
import { toHex } from 'viem';
import { useAccount } from 'wagmi';

import { defaultChain } from 'constants/chains';
import { createNetworkInstance, updateNetworkLayer } from 'layers/network/createNetworkLayer';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ValidatorWrapper } from 'layers/react/components/library/ValidatorWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { useNetwork, useVisibility } from 'layers/react/store';

// Detects network changes and populates network clients for inidividual addresses.
// The purpose of this modal is to warn the user when something is amiss.
//
// TERMINOLOGY:
//    injectedAddress (privy) = ownerAddress (kamiworld) = connectorAddress (e.g. MM)
//    embeddedAddress (privy) = operatorAddress (kamiworld)
export function registerWalletConnecter() {
  registerUIComponent(
    'WalletConnecter',
    {
      colStart: 30,
      colEnd: 70,
      rowStart: 40,
      rowEnd: 60,
    },
    (layers) => of(layers),
    (layers) => {
      const { network } = layers;
      const { address: connectorAddress, chain } = useAccount();
      const { ready, authenticated, login, logout } = usePrivy();
      const { wallets } = useWallets();

      const { apis, addAPI } = useNetwork();
      const { burnerAddress, setBurnerAddress, setSelectedAddress } = useNetwork();
      const { validations, setValidations } = useNetwork();
      const { toggleButtons, toggleModals, toggleFixtures } = useVisibility();
      const { validators, setValidators } = useVisibility();

      const [isUpdating, setIsUpdating] = useState(false);
      const [state, setState] = useState('');

      // update network settings/validations on relevant network updates
      useEffect(() => {
        if (!ready) return;
        const chainMatches = chain?.id === defaultChain.id;
        if (!chainMatches) setState('wrongChain');
        else if (!authenticated) {
          setState('disconnected');
          setSelectedAddress('');
        } else updateNetworkSettings();

        if (!isEqual(validations, { authenticated, chainMatches })) {
          setValidations({ authenticated, chainMatches });
        }
      }, [ready, authenticated, chain, wallets]);

      // adjust visibility of windows based on above determination
      useEffect(() => {
        const isVisible = !validations.authenticated || !validations.chainMatches;
        if (isVisible) {
          toggleModals(false);
          toggleButtons(false);
          toggleFixtures(false);
        }
        if (isVisible != validators.walletConnector) {
          setValidators({ ...validators, walletConnector: isVisible });
        }
      }, [validations]);

      // log the user out if mismatch of privy injected wallet and wagmi connector
      useEffect(() => {
        const injectedWallet = getInjectedWallet(wallets);
        if (injectedWallet) {
          const injectedAddress = injectedWallet.address;
          if (connectorAddress !== injectedAddress) logout();
        }
      }, [wallets, connectorAddress]);

      /////////////////
      // ACTIONS

      // update the network settings for the given wallets
      // opt for localstorage private key if in development mode
      const updateNetworkSettings = async () => {
        const injectedWallet = getInjectedWallet(wallets);
        const embeddedWallet = getEmbeddedWallet(wallets);
        if (isUpdating || !injectedWallet || !embeddedWallet) return;

        setIsUpdating(true);
        await addNetworkAPI(injectedWallet);
        await updateBaseNetwork(embeddedWallet);
        setIsUpdating(false);
      };

      // update the network store with the injected wallet's api
      const addNetworkAPI = async (wallet: ConnectedWallet) => {
        const injectedAddress = wallet.address.toLowerCase();
        if (!apis.has(injectedAddress)) {
          console.log(`Establishing APIs for 0x..${injectedAddress.slice(-6)}`);
          const provider = (await wallet.getWeb3jsProvider()) as ExternalProvider;
          const networkInstance = await createNetworkInstance(provider);
          const systems = network.createSystems(networkInstance);
          addAPI(injectedAddress, systems);
        }
        setSelectedAddress(injectedAddress);
      };

      // update the base network with the embedded wallet
      // TODO: properly dispose the old network layer
      const updateBaseNetwork = async (wallet: ConnectedWallet) => {
        const embeddedAddress = wallet.address.toLowerCase();
        if (burnerAddress !== embeddedAddress) {
          console.log(`Updating base network 0x..${embeddedAddress.slice(-6)}`);
          const provider = (await wallet.getWeb3jsProvider()) as ExternalProvider;
          await updateNetworkLayer(network, provider);
          setBurnerAddress(embeddedAddress);
        }
      };

      // triggers a network switch request with the connector found in the window.ethereum slot
      const updateConnectedChain = async () => {
        const injectedWallet = getInjectedWallet(wallets);
        if (!injectedWallet) return console.error(`No injected wallet found.`);

        if (window.ethereum) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: toHex(defaultChain.id),
                  chainName: defaultChain.name,
                  rpcUrls: defaultChain.rpcUrls.default.http,
                  nativeCurrency: defaultChain.nativeCurrency,
                  blockExplorerUrls: [
                    defaultChain.blockExplorers?.default.url ?? 'https://etherscan.io',
                  ],
                },
              ],
            });
          } catch (e) {
            console.error(e);
          }
          injectedWallet.switchChain(defaultChain.id);
        }
      };

      const handleClick = () => {
        if (!validations.chainMatches) updateConnectedChain();
        else if (!authenticated) login();
      };

      /////////////////
      // INTERPRETATION

      // get the wallet labeled as 'injected' from the list of privy ConnectedWallets
      const getInjectedWallet = (wallets: ConnectedWallet[]) => {
        return wallets.find((w) => w.connectorType === 'injected');
      };

      // get the wallet labeled as 'embedded' from the list of privy ConnectedWallets
      const getEmbeddedWallet = (wallets: ConnectedWallet[]) => {
        return wallets.find((w) => w.connectorType === 'embedded');
      };

      const getTitle = () => {
        if (state === 'disconnected') return 'Wallet Disconnected';
        if (state === 'wrongChain') return 'Wrong Network';
        return '';
      };

      const getWarning = () => {
        if (state === 'disconnected') return `Your wallet is currently disconnected.`;
        if (state === 'wrongChain') return `You're currently connected to ${chain?.name} network`;
        return '';
      };

      const getDescription = () => {
        if (state === 'disconnected') return 'You must connect one to continue.';
        if (state === 'wrongChain') return `Please connect to ${defaultChain.name} network.`;
        return '';
      };

      const getButtonLabel = () => {
        if (state === 'disconnected') return 'Log in';
        if (state === 'wrongChain') return 'Change Networks';
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
          <ActionButton onClick={handleClick} text={getButtonLabel()} size='vending' />
        </ValidatorWrapper>
      );
    }
  );
}

const Description = styled.div`
  font-size: 12px;
  color: #333;
  text-align: center;
  padding: 0px 0px 20px 0px;
  font-family: Pixel;
`;
