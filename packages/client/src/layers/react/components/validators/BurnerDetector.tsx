import { useWallets } from '@privy-io/react-auth';
import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ValidatorWrapper } from 'layers/react/components/library/ValidatorWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { useLocalStorage } from 'layers/react/hooks/useLocalStorage';
import { useNetwork, useVisibility } from 'layers/react/store';
import 'layers/react/styles/font.css';
import { generatePrivateKey, getAddressFromPrivateKey } from 'utils/address';

export function registerBurnerDetector() {
  registerUIComponent(
    'BurnerDetector',
    {
      colStart: 20,
      colEnd: 80,
      rowStart: 30,
      rowEnd: 70,
    },
    (layers) => {
      const { network } = layers;
      const { IsAccount, OwnerAddress, IsRegistry } = network.components;

      return merge(
        IsAccount.update$,
        IsRegistry.update$, // hilarious hack to resolve race conditions
        OwnerAddress.update$
      ).pipe(
        map(() => {
          const connectedEOA = network.network.connectedAddress.get() ?? '';
          return {
            connectedEOA,
            network: layers.network.network,
          };
        })
      );
    },

    ({ connectedEOA, network }) => {
      const [detectedPrivateKey, setDetectedPrivateKey] = useLocalStorage('operatorPrivateKey', '');
      const { wallets } = useWallets();

      const { toggleButtons, toggleModals, toggleFixtures } = useVisibility();
      const { validators, setValidators } = useVisibility();
      const { validations, setValidations } = useNetwork();

      const [isVisible, setIsVisible] = useState(false);
      const [burnerMatches, setBurnerMatches] = useState(false);
      const [detectedAddress, setDetectedAddress] = useState('');
      const [input, setInput] = useState('');
      const [errorPrimary, setErrorPrimary] = useState('');
      const [errorSecondary, setErrorSecondary] = useState('');

      // listen on changes to the detectedEOA to determine mismatch
      useEffect(() => {
        const detectedEOA = getAddressFromPrivateKey(detectedPrivateKey);
        setDetectedAddress(detectedEOA);

        const burnerMatches = parseInt(connectedEOA, 16) === parseInt(detectedEOA, 16);
        setBurnerMatches(burnerMatches);

        if (!detectedPrivateKey) {
          setErrorPrimary('No Burner Detected');
          setErrorSecondary('Please enter a private key.');
        } else if (!detectedEOA) {
          setErrorPrimary('Invalid Burner Detected');
          setErrorSecondary('Please enter a private key.');
        } else if (!burnerMatches) {
          setErrorPrimary('Mismatch Detected');
          setErrorSecondary('Please Refresh or enter the correct private key.');
        }

        // setBurner({
        //   connected: { address: connectedEOA },
        //   detected: {
        //     address: detectedEOA,
        //     key: detectedPrivateKey,
        //   },
        // });
        setValidations({ ...validations, burnerMatches: true });
      }, [detectedPrivateKey, connectedEOA]);

      // determining visibility based on above/prev checks
      useEffect(() => {
        setIsVisible(validations.authenticated && validations.chainMatches && !burnerMatches);
      }, [validations, burnerMatches]);

      // adjust visibility of windows based on above determination
      useEffect(() => {
        // if (isVisible) {
        //   toggleModals(false);
        //   toggleButtons(false);
        //   toggleFixtures(false);
        // }
        if (isVisible != validators.burnerDetector) {
          const { validators } = useVisibility.getState();
          setValidators({ ...validators, burnerDetector: false });
        }
      }, [isVisible, validators.walletConnector]);

      /////////////////
      // STATE

      const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInput(event.target.value);
      };

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          setDetectedPrivateKey(input);
        }
      };

      /////////////////
      // DISPLAY

      const GenerateButton = () => (
        <ActionButton
          id={`generate-burner`}
          onClick={() => setInput(generatePrivateKey())}
          text='Generate'
          size='vending'
        />
      );

      const SubmitButton = () => (
        <ActionButton
          id={`set-burner`}
          onClick={() => setDetectedPrivateKey(input)}
          text='Submit'
          size='vending'
        />
      );

      const PrivateKeyInput = () => (
        <Input
          type='text'
          placeholder='burner private key'
          value={input}
          onKeyDown={(e) => catchKeys(e)}
          onChange={(e) => handleInputChange(e)}
        />
      );

      return (
        <ValidatorWrapper
          id='burner-detector'
          divName='burnerDetector'
          title='Burner Address Detector'
          errorPrimary={errorPrimary}
          errorSecondary={errorSecondary}
        >
          <Description>Connected: {network.connectedAddress.get()}</Description>
          <Description>Detected: {detectedAddress}</Description>
          <br />
          {PrivateKeyInput()}
          <ActionWrapper>
            {GenerateButton()}
            {SubmitButton()}
          </ActionWrapper>
        </ValidatorWrapper>
      );
    }
  );
}

const Input = styled.input`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px 12px;
  margin: 10px 5px 5px 5px;

  text-align: left;
  text-decoration: none;
  display: inline-block;
  font-size: 12px;
  cursor: pointer;
  border-radius: 5px;
  justify-content: center;
  font-family: Pixel;
`;

const Description = styled.div`
  font-size: 12px;
  color: #333;
  text-align: center;
  font-family: Pixel;
  padding: 5px 0px;
`;

const ActionWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;
