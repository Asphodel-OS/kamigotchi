import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled, { keyframes } from 'styled-components';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ValidatorWrapper } from 'layers/react/components/library/ValidatorWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { useLocalStorage } from 'layers/react/hooks/useLocalStorage'
import { useComponentSettings } from 'layers/react/store/componentSettings';
import { useNetworkSettings } from 'layers/react/store/networkSettings'
import { generatePrivateKey, getAddressFromPrivateKey } from 'utils/address';
import 'layers/react/styles/font.css';


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
      const {
        network: {
          network,
          components: { IsAccount, OwnerAddress, IsRegistry },
        },
      } = layers;

      return merge(
        IsAccount.update$,
        IsRegistry.update$, // hilarious hack to resolve race conditions
        OwnerAddress.update$
      ).pipe(
        map(() => {
          const connectedEOA = network.connectedAddress.get();
          return {
            connectedEOA,
            network: layers.network.network,
          };
        })
      );
    },

    ({ connectedEOA, network }) => {
      const [detectedPrivateKey, setDetectedPrivateKey] = useLocalStorage('operatorPrivateKey', '');
      const { toggleButtons, toggleModals, toggleFixtures } = useComponentSettings();
      const { validators, setValidators } = useComponentSettings();
      const { setBurnerInfo } = useNetworkSettings();

      const [detectedAddress, setDetectedAddress] = useState('');
      const [isMismatched, setIsMismatched] = useState(false);
      const [input, setInput] = useState('');

      // set the detectedEOA upon detectedPrivateKey change and determine mismatch
      useEffect(() => {
        const detectedEOA = getAddressFromPrivateKey(detectedPrivateKey);
        setDetectedAddress(detectedEOA);
        setBurnerInfo({
          connected: connectedEOA ?? '',
          detected: detectedEOA,
          detectedPrivateKey,
        });
        setIsMismatched(connectedEOA !== detectedEOA);
      }, [detectedPrivateKey, connectedEOA]);

      // adjust visibility of windows based on above determination
      useEffect(() => {
        if (isMismatched) {
          toggleModals(false);
          toggleButtons(false);
          toggleFixtures(false);
        }
        setValidators({
          ...validators,
          burnerDetector: !validators.walletConnector && isMismatched
        });
      }, [validators.walletConnector, isMismatched]);


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
      )

      const PrivateKeyInput = () => (
        <Input
          type='text'
          placeholder='burner private key'
          value={input}
          onKeyDown={(e) => catchKeys(e)}
          onChange={(e) => handleInputChange(e)}
        />
      );

      const ErrorMessage = () => {
        let title = '', message = '';

        if (!detectedPrivateKey) {
          title = 'No Burner Detected';
          message = 'Please enter a private key.';
        } else if (!detectedAddress) {
          title = 'Invalid Burner Detected';
          message = 'Please enter a private key.';
        } else if (isMismatched) {
          title = 'Mismatch Detected';
          message = 'Please Refresh or enter the correct private key.';
        }

        return (
          <>
            <ErrorTitle>{title}</ErrorTitle>
            <ErrorText>{message}</ErrorText>
          </>
        )
      };


      return (
        <ValidatorWrapper
          id='burner-detector'
          divName='burnerDetector'
          title='Burner Address Detector'
        >
          {ErrorMessage()}
          <br />
          <br />
          <Description>Connected: {network.connectedAddress.get()}</Description>
          <br />
          <Description>Detected: {detectedAddress}</Description>
          <br />
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

const Description = styled.p`
  font-size: 12px;
  color: #333;
  text-align: center;
  font-family: Pixel;
`;

const ErrorTitle = styled.div`
  font-size: 14px;
  color: #922;
  padding: 10px;
  text-align: center;
  font-family: Pixel;
`

const ErrorText = styled.p`
  font-size: 12px;
  color: #922;
  text-align: center;
  font-family: Pixel;
`;

const ActionWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;