import React, { useEffect, useState } from 'react';
import { of } from 'rxjs';
import styled, { keyframes } from 'styled-components';
import { useAccount, useBalance, useNetwork } from 'wagmi';
import { EntityID, EntityIndex } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';
import crypto from "crypto";

import { defaultChainConfig } from 'constants/chains';
import { registerUIComponent } from 'layers/react/engine/store';
import { useKamiAccount } from 'layers/react/store/kamiAccount';
import { useNetworkSettings } from 'layers/react/store/networkSettings'
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { playClick, playSuccess } from 'utils/sounds';
import 'layers/react/styles/font.css';


// TODO: check for whether an account with the burner address already exists
export function registerGasHarasser() {
  registerUIComponent(
    'GasHarasser',
    {
      colStart: 25,
      colEnd: 75,
      rowStart: 25,
      rowEnd: 70,
    },
    (layers) => of(layers),
    (layers) => {
      const { network: { actions, world } } = layers;

      // TODO(ja): Refactor all these goddamn validator hooks into a store 
      const { isConnected } = useAccount();
      const { chain } = useNetwork();
      const { details: accountDetails } = useKamiAccount();
      const { burnerInfo, selectedAddress, networks } = useNetworkSettings();
      const [isVisible, setIsVisible] = useState(false);
      const [value, setValue] = useState(.05);

      const { data: OperatorBal } = useBalance({
        address: accountDetails.operatorAddress as `0x${string}`,
        watch: true
      });

      // toggle visibility based on many things
      useEffect(() => {
        const meetsPreconditions = (
          isConnected
          && chain?.id === defaultChainConfig.id
          && burnerInfo.connected === burnerInfo.detected
          && !!accountDetails.id
          && accountDetails.operatorAddress === burnerInfo.connected
        );

        const hasGas = Number(OperatorBal?.formatted) > 0;
        setIsVisible(meetsPreconditions && !hasGas);
      }, [chain, isConnected, burnerInfo, accountDetails.operatorAddress, OperatorBal]);


      /////////////////
      // ACTIONS

      const fundTx = async () => {
        const network = networks.get(selectedAddress);
        const account = network!.api.player.account;

        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'AccountFund',
          params: [value.toString()],
          description: `Funding Operator ${value.toString()}`,
          execute: async () => {
            return account.fund(value.toString());
          },
        });
        const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
        await waitForActionCompletion(actions!.Action, actionIndex);
      };


      /////////////////
      // FORM HANDLING

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = Number(event.target.value);
        newValue = Math.max(0.01, newValue);
        newValue = Math.min(0.1, newValue);
        setValue(newValue);
      };

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          fundTx();
        }
      };

      const feed = async () => {
        playClick();
        await fundTx();
        playSuccess();
      }


      /////////////////
      // DISPLAY

      return (
        <Wrapper id='gas-harasser' style={{ display: isVisible ? 'block' : 'none' }}>
          <Content style={{ pointerEvents: 'auto' }}>
            <Title>Feed Your Operator</Title>
            <Warning>Your Operator is EMPTY</Warning>
            <br />
            <Warning>You're lucky we don't report you to the authorities..</Warning>
            <Description>Account Operator: {accountDetails.operatorAddress}</Description>
            <br />
            <Row>
              <Input
                type='number'
                value={value}
                step='0.01'
                onChange={(e) => handleChange(e)}
                onKeyDown={(e) => catchKeys(e)}
                style={{ pointerEvents: 'auto' }}
              />
              <ActionButton id={`feed`} text='Feed' onClick={feed} size='vending' />
            </Row>
          </Content>
        </Wrapper>
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

const Wrapper = styled.div`
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 1.3s ease-in-out;
`;

const Content = styled.div`
  width: 99%;    
  border-radius: 10px;
  border-style: solid;
  border-width: 2px;
  border-color: black;

  background-color: white;
  padding: 30px 20px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;


const Title = styled.p`
  font-size: 18px;
  color: #333;
  text-align: center;
  font-family: Pixel;
  padding: 5px 0px;
`;

const Description = styled.p`
  font-size: 12px;
  color: #333;
  text-align: center;
  font-family: Pixel;
  padding: 5px 0px;
`;

const Warning = styled.p`
  font-size: 12px;
  color: #FF785B;
  text-align: center;
  font-family: Pixel;
  padding: 5px 0px;
`;

const Input = styled.input`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px 12px;
  margin: 5px 0px;

  text-align: left;
  text-decoration: none;
  display: inline-block;
  font-size: 12px;
  cursor: pointer;
  border-radius: 5px;
  justify-content: center;
  font-family: Pixel;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;
