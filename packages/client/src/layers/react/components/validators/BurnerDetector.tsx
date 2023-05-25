import React, { useState } from 'react';
import { map, merge, of } from 'rxjs';
import styled, { keyframes } from 'styled-components';
import { useAccount } from 'wagmi';

import { useLocalStorage } from 'layers/react/hooks/useLocalStorage'
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { generatePrivateKey, getAddressFromPrivateKey } from 'src/utils/address';

import 'layers/react/styles/font.css';

export function registerBurnerDetector() {
  registerUIComponent(
    'BurnerDetector',
    {
      colStart: 20,
      colEnd: 80,
      rowStart: 70,
      rowEnd: 90,
    },
    (layers) => {
      const {
        network: {
          components: { IsAccount, OwnerAddress },
        },
      } = layers;

      return merge(IsAccount.update$, OwnerAddress.update$).pipe(
        map(() => {
          return {
            network: layers.network.network,
          };
        })
      );
    },

    ({ network }) => {
      const connectedBurnerAddress = network.connectedAddress.get();
      const { isConnected } = useAccount();
      const [burnerPrivateKey, setBurnerPrivateKey] = useLocalStorage('operatorPrivateKey', '');
      const [input, setInput] = useState('');

      /////////////////
      // DATA

      // generate the warning message for the detected issue
      const getWarning = () => {
        let warningMessage = '';
        const computedAddress = getAddressFromPrivateKey(burnerPrivateKey);
        if (!burnerPrivateKey) {
          warningMessage = 'No burner detected. Please enter a private key.';
        } else if (!computedAddress) {
          warningMessage = 'Invalid burner detected. Please enter a private key.';
        } else if (computedAddress !== connectedBurnerAddress) {
          warningMessage = 'Mismatch detected. Please refresh or enter the correct private key.';
        }
        // should we include mismatch with account ?
        return warningMessage;
      }

      const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInput(event.target.value);
      };

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          setBurnerPrivateKey(input);
        }
      };

      /////////////////
      // DISPLAY

      // how to render the modal
      const modalDisplay = () => (
        (isConnected && getWarning()) ? 'block' : 'none'
      );

      const GenerateButton = () => (
        <ActionButton
          id={`generate-burner`}
          onClick={() => setInput(generatePrivateKey())}
          text='Generate'
        />
      );

      const SubmitButton = () => (
        <ActionButton
          id={`set-burner`}
          onClick={() => setBurnerPrivateKey(input)}
          text='Submit'
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


      return (
        <ModalWrapper id='burner-detector' style={{ display: modalDisplay() }}>
          <ModalContent style={{ pointerEvents: 'auto' }}>
            <Title>Burner Address Detector</Title>
            <br />
            <Header>Addresses</Header>
            <br />
            <Description>Connected: {connectedBurnerAddress}</Description>
            <br />
            <Description>Detected: {getAddressFromPrivateKey(burnerPrivateKey)}</Description>
            <br />
            <br />
            <ErrorMessage>{getWarning()}</ErrorMessage>
            {PrivateKeyInput()}
            <ActionWrapper>
              {GenerateButton()}
              {SubmitButton()}
            </ActionWrapper>
          </ModalContent>
        </ModalWrapper>
      );
    }
  );
}

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const Input = styled.input`
  width: 80%;

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

const ModalWrapper = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 1.3s ease-in-out;
`;

const ModalContent = styled.div`
  width: 99%;    
  border-radius: 10px;
  border-style: solid;
  border-width: 2px;
  border-color: black;

  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  padding: 20px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const ActionWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const Title = styled.p`
  font-size: 18px;
  color: #333;
  text-align: center;
  font-family: Pixel;
`;


const Header = styled.p`
  font-size: 14px;
  color: #333;
  text-align: center;
  font-family: Pixel;
`;

const Description = styled.p`
  font-size: 12px;
  color: #333;
  text-align: center;
  font-family: Pixel;
`;

const ErrorMessage = styled.p`
  font-size: 12px;
  color: #922;
  text-align: center;
  font-family: Pixel;
`;
