import { EntityID, EntityIndex } from '@mud-classic/recs';
import React, { useEffect, useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';
import { formatEther } from 'viem';
import { useBalance, useWatchBlockNumber } from 'wagmi';

import { GasConstants } from 'constants/gas';
import { waitForActionCompletion } from 'layers/network/utils';
import { ActionButton, ValidatorWrapper } from 'layers/react/components/library';
import { registerUIComponent } from 'layers/react/root';
import { useAccount, useNetwork, useVisibility } from 'layers/react/store';
import { playFund, playSuccess } from 'utils/sounds';

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
      const { network } = layers;
      const { actions, world } = network;

      const { account, validations, setValidations } = useAccount();
      const { selectedAddress, apis, validations: networkValidations } = useNetwork();
      const { validators, setValidators, toggleModals } = useVisibility();

      const [value, setValue] = useState(0.075);

      /////////////////
      // SUBSCRIPTIONS

      useWatchBlockNumber({
        onBlockNumber: (n) => refetch(),
      });

      const { data: balance, refetch } = useBalance({
        address: account.operatorAddress as `0x${string}`,
      });

      /////////////////
      // TRACKING

      // run the primary check(s) for this validator, track in store for easy access
      useEffect(() => {
        if (!validations.operatorMatches) return;
        const hasGas = hasEnoughGas(balance?.value ?? BigInt(0));
        if (hasGas == validations.operatorHasGas) return; // no change
        setValidations({ ...validations, operatorHasGas: hasGas });
      }, [validations.operatorMatches, balance]);

      // adjust actual visibility of windows based on above determination
      useEffect(() => {
        const isVisible =
          networkValidations.authenticated &&
          networkValidations.chainMatches &&
          validations.accountExists &&
          validations.operatorMatches &&
          !validations.operatorHasGas;

        if (isVisible) toggleModals(false);
        if (isVisible != validators.gasHarasser) {
          setValidators({
            walletConnector: false,
            accountRegistrar: false,
            operatorUpdater: false,
            gasHarasser: isVisible,
          });
        }
      }, [networkValidations, validations.operatorMatches, validations.operatorHasGas]);

      /////////////////
      // INTERPRETATION

      // abstracted out for easy modification and readability. keyword: 'Enough'
      const hasEnoughGas = (value: bigint) => {
        return Number(formatEther(value)) > GasConstants.Warning;
      };

      /////////////////
      // ACTION

      const fundTx = async () => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions.add({
          action: 'AccountFund',
          params: [value.toString()],
          description: `Funding Operator ${value.toString()}`,
          execute: async () => {
            return api.account.fund(value.toString());
          },
        });
        const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
        await waitForActionCompletion(actions!.Action, actionIndex);
      };

      /////////////////
      // INTERACTION

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = Number(event.target.value);
        newValue = Math.max(GasConstants.Low, newValue);
        newValue = Math.min(GasConstants.Max, newValue);
        setValue(newValue);
      };

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          fundTx();
        }
      };

      const feed = async () => {
        playFund();
        await fundTx();
        playSuccess();
      };

      /////////////////
      // DISPLAY

      return (
        <ValidatorWrapper
          id='gas-harasser'
          divName='gasHarasser'
          title='Feed Your Avatar'
          errorPrimary='Avatar is EMPTY and STARVING'
          errorSecondary={`You're lucky we don't report you to the authorities..`}
        >
          <Description>Account Avatar: {account.operatorAddress}</Description>
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
            <ActionButton text='Feed' onClick={feed} size='vending' />
          </Row>
        </ValidatorWrapper>
      );
    }
  );
}

const Description = styled.div`
  font-size: 12px;
  color: #333;
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
