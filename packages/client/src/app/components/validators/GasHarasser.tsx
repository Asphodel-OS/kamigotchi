import { EntityID, EntityIndex } from '@mud-classic/recs';
import React, { useEffect, useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';
import { formatUnits } from 'viem';
import { useBalance, useWatchBlockNumber } from 'wagmi';

import { ActionButton, Tooltip, ValidatorWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useAccount, useNetwork, useVisibility } from 'app/stores';
import { copy } from 'app/utils';
import { GasConstants, GasExponent } from 'constants/gas';
import { waitForActionCompletion } from 'network/utils';
import { abbreviateAddress } from 'utils/address';
import { playFund, playSuccess } from 'utils/sounds';

export function registerGasHarasser() {
  registerUIComponent(
    'GasHarasser',
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
      const { actions, world } = network;

      const { account, validations, setValidations } = useAccount();
      const { selectedAddress, apis, validations: networkValidations } = useNetwork();
      const { validators, setValidators, toggleModals } = useVisibility();

      const fullGas = GasConstants.Full; // js floating points are retarded
      const [value, setValue] = useState(fullGas);

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
        return Number(formatUnits(value, GasExponent)) > GasConstants.Warning;
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
          description: `Funding Operator ${value.toLocaleString()} ONYX`,
          execute: async () => {
            return api.send(account.operatorAddress, value);
          },
        });
        const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
        await waitForActionCompletion(actions!.Action, actionIndex);
      };

      /////////////////
      // INTERACTION

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = Number(event.target.value);
        newValue = Math.max(fullGas / 10, newValue);
        newValue = Math.min(fullGas * 10, newValue);
        setValue(newValue);
      };

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') feed();
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
          title='Embedded wallet is empty!'
          errorPrimary={`pls feed me pls a crumb of onyx ._.`}
        >
          <Tooltip text={[account.operatorAddress, '(click to copy)']}>
            <Description onClick={() => copy(account.operatorAddress)}>
              Address: {abbreviateAddress(account.operatorAddress)}
            </Description>
          </Tooltip>
          <Row>
            <Input
              type='number'
              value={value}
              step={fullGas / 10}
              onChange={(e) => handleChange(e)}
              onKeyDown={(e) => catchKeys(e)}
              style={{ pointerEvents: 'auto' }}
            />
            <ActionButton text='feed' onClick={feed} />
          </Row>
        </ValidatorWrapper>
      );
    }
  );
}

const Description = styled.div`
  color: #333;
  padding: 0.9vw 0 0 0;
  font-size: 0.9vw;
  line-height: 1.5vw;
  text-align: center;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin: 0.75vw;
  gap: 0.15vw;
`;

const Input = styled.input`
  background-color: #ffffff;
  border: solid black 0.15vw;
  border-radius: 0.45vw;

  color: black;
  width: 9vw;
  height: 1.8vw;
  padding: 0.6vw;

  font-size: 0.75vw;
  text-align: left;
  text-decoration: none;

  cursor: text;
  justify-content: center;
`;

const Link = styled.div`
  color: #11f;
  padding-top: 1.2vh;
  cursor: pointer;
  pointer-events: auto;

  font-size: 1.2vh;
  text-decoration: underline;
  text-align: center;

  &:hover {
    color: #71f;
    opacity: 0.7;
  }
`;
