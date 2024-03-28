import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';
import { toHex } from 'viem';
import { useAccount } from 'wagmi';

import { defaultChain } from 'constants/chains';
import { createNetworkConfig } from 'layers/network';
import { createNetwork } from 'layers/network/workers';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ValidatorWrapper } from 'layers/react/components/library/ValidatorWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { useNetwork as useMUDNetwork, useVisibility } from 'layers/react/store';
import 'layers/react/styles/font.css';

// Detects network changes and populates network clients for inidividual addresses.
// The purpose of this modal is to warn the user when something is amiss.
//
// TERMINOLOGY:
//    connectorAddress (MM) = injectedAddress (privy) = ownerAddress (kamiworld)
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
      const { address: connectorAddress, chain, connector } = useAccount();
      const { wallets } = useWallets();
      const { ready, authenticated, login, logout } = usePrivy();

      const { validators, setValidators } = useVisibility();
      const { toggleButtons, toggleModals, toggleFixtures } = useVisibility();
      const { apis, addAPI, setSelectedAddress } = useMUDNetwork();
      const { validations, setValidations } = useMUDNetwork();

      const [isVisible, setIsVisible] = useState(false);
      const [title, setTitle] = useState('');
      const [description, setDescription] = useState('');
      const [warning, setWarning] = useState('');
      const [buttonLabel, setButtonLabel] = useState('');

      // update the network settings whenever the connector/address changes
      // determine whether/with what content this Validator should be populated
      useEffect(() => {
        let isVisible = true;
        const chainMatches = chain?.id === defaultChain.id;
        setValidations({ ...validations, chainMatches, authenticated });

        const injectedAddress = wallets.find((w) => w.connectorType === 'injected')?.address;
        const addressesMatch = connectorAddress === injectedAddress;

        // populate validator or initialize network depending on network validity
        if (ready && !authenticated) {
          setSelectedAddress('');
          setTitle('Wallet Disconnected');
          setWarning(`Your wallet is currently disconnected.`);
          setDescription('You must connect one to continue.');
          setButtonLabel('Log in');
        } else if (!chainMatches) {
          setTitle('Wrong Network');
          setWarning(`You're currently connected to ${chain?.name} network`);
          setDescription(`Please connect to ${defaultChain.name} network.`);
          setButtonLabel('Change Networks');
        } else if (injectedAddress && connectorAddress && !addressesMatch) {
          // log the user out if we conclusively identify a mismatch
          console.warn('Addresses Mismatched. Logging Out.');
          logout();
        } else {
          isVisible = false;
          updateNetworkSettings();
        }

        setIsVisible(isVisible);
      }, [chain, ready, authenticated, connectorAddress, wallets]);

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

      // add a network layer if one for the connection doesnt exist
      const updateNetworkSettings = async () => {
        // set the selected address and spawn network client for address as needed
        const connectorAddressLowerCase = connectorAddress!.toLowerCase();
        const chainMatches = chain?.id === defaultChain.id;
        setSelectedAddress(connectorAddressLowerCase);

        if (chainMatches && !apis.has(connectorAddressLowerCase)) {
          console.log(`Establishing APIs for 0x..${connectorAddressLowerCase.slice(-6)}`);

          // create network config
          const provider = await connector!.getProvider();
          const networkConfig = createNetworkConfig(provider);
          if (!networkConfig) throw new Error('Invalid config');

          // create api for the new network
          // NOTE: may be inefficient but easiest workaround to create boutique signer
          const networkInstance = await createNetwork(networkConfig);
          const systems = layers.network.createSystems(networkInstance.signer);
          addAPI(connectorAddressLowerCase, systems);
        }
      };

      // triggers a network switch request with the connector found in the window.ethereum slot
      const changeNetwork = async () => {
        if (window.ethereum) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: toHex(defaultChain.id) }],
            });
          } catch (e) {
            console.error(e);
          }
        }
      };

      const handleClick = () => {
        if (ready && !authenticated) login();
        else if (chain?.id !== defaultChain.id) changeNetwork();
      };

      /////////////////
      // RENDER

      return (
        <ValidatorWrapper
          id='wallet-connector'
          divName='walletConnector'
          title={title}
          errorPrimary={warning}
        >
          <Description>{description}</Description>
          <ActionButton id='connect' onClick={handleClick} text={buttonLabel} size='vending' />
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
