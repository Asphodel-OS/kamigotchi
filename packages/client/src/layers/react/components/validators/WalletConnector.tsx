import { ExternalProvider } from '@ethersproject/providers';
import { ConnectedWallet, usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';
import { toHex } from 'viem';
import { useAccount } from 'wagmi';

import { defaultChain } from 'constants/chains';
import { Wallet } from 'ethers';
import { createNetworkInstance, updateNetworkLayer } from 'layers/network/createNetworkLayer';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ValidatorWrapper } from 'layers/react/components/library/ValidatorWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import useLocalStorage from 'layers/react/hooks/useLocalStorage';
import { useNetwork, useVisibility } from 'layers/react/store';
import 'layers/react/styles/font.css';

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
      const { network, phaser } = layers;
      const [detectedPrivateKey, _] = useLocalStorage('operatorPrivateKey', '');

      const { address: connectorAddress, chain } = useAccount();
      const { ready, authenticated, login, logout } = usePrivy();
      const { wallets } = useWallets();

      const { apis, addAPI, setBurnerAddress, setSelectedAddress } = useNetwork();
      const { validations, setValidations } = useNetwork();
      const { toggleButtons, toggleModals, toggleFixtures } = useVisibility();
      const { validators, setValidators } = useVisibility();

      const [isVisible, setIsVisible] = useState(false);
      const [state, setState] = useState('');

      // update the network settings whenever the connector/address changes
      // determine whether/with what content this Validator should be populated
      useEffect(() => {
        const chainMatches = chain?.id === defaultChain.id;
        setIsVisible(!authenticated || !chainMatches);
        setValidations({ ...validations, authenticated, chainMatches });

        // update state or initialize networks depending on wallet validity
        if (ready && !authenticated) setState('disconnected');
        else if (!chainMatches) setState('wrongChain');
        else {
          const injectedWallet = getInjectedWallet(wallets);
          const embeddedWallet = getEmbeddedWallet(wallets);
          if (injectedWallet && embeddedWallet)
            updateNetworkSettings(injectedWallet, embeddedWallet);
        }
      }, [ready, authenticated, chain, wallets, detectedPrivateKey]);

      // log the user out if mismatch of privy injected wallet and wagmi connector
      useEffect(() => {
        const injectedWallet = getInjectedWallet(wallets);
        if (injectedWallet) {
          const injectedAddress = injectedWallet.address;
          const addressesMatch = connectorAddress === injectedAddress;
          if (!addressesMatch) logout();
        }
      }, [wallets, connectorAddress]);

      // things to fix
      // ? swap out funding call with privy
      // ? funding rails in localhost

      // adjust visibility of windows based on above determination
      useEffect(() => {
        if (isVisible) {
          toggleModals(false);
          toggleButtons(false);
          toggleFixtures(false);
        }
        if (isVisible != validators.walletConnector) {
          const { validators } = useVisibility.getState();
          setValidators({ ...validators, walletConnector: isVisible });
        }
      }, [isVisible]);

      /////////////////
      // ACTIONS

      // update the network settings for the given wallets
      // opt for localstorage private key if in development mode
      const updateNetworkSettings = async (
        injectedWallet: ConnectedWallet,
        embeddedWallet: ConnectedWallet
      ) => {
        await addNetworkAPI(injectedWallet);
        if (import.meta.env.DEV) {
          const wallet = new Wallet(detectedPrivateKey);
          const address = wallet.address.toLowerCase();
          if (network.network.connectedAddress.get() !== address) {
            console.log(`Updating base network w pk 0x..${detectedPrivateKey.slice(-6)}`);
            const networkLayer = await updateNetworkLayer(network);
            phaser.setChangeRoomSystem(networkLayer);
          }
          setBurnerAddress(address);
        } else await updateBaseNetwork(embeddedWallet);
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
      const updateBaseNetwork = async (wallet: ConnectedWallet) => {
        const embeddedAddress = wallet.address.toLowerCase();

        if (network.network.connectedAddress.get() !== embeddedAddress) {
          console.log(`Updating base network 0x..${embeddedAddress.slice(-6)}`);
          const provider = (await wallet.getWeb3jsProvider()) as ExternalProvider;
          const networkLayer = await updateNetworkLayer(network, provider);
          phaser.setChangeRoomSystem(networkLayer);
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
            injectedWallet.switchChain(defaultChain.id);
          } catch (e) {
            console.error(e);
          }
        }
      };

      const handleClick = () => {
        if (ready && !authenticated) login();
        else if (chain?.id !== defaultChain.id) updateConnectedChain();
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
          <ActionButton id='connect' onClick={handleClick} text={getButtonLabel()} size='vending' />
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
