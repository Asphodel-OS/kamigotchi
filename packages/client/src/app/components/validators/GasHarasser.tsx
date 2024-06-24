import { EntityID, EntityIndex } from '@mud-classic/recs';
import React, { useEffect, useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';
import { formatEther } from 'viem';
import { useBalance, useWatchBlockNumber } from 'wagmi';

import { ActionButton, ValidatorWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useAccount, useNetwork, useVisibility } from 'app/stores';
import { GasConstants } from 'constants/gas';
import { waitForActionCompletion } from 'network/utils';
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

      const fullGas = 0.0001; // hard coded bc js floating points are retarded
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
          errorPrimary={`Please top up on gas ._.`}
        >
          <Link onClick={() => window.open('https://yominet.hub.caldera.xyz/', '_blank')}>
            Need eth? Check out the faucet.
          </Link>
          <Description>Address: {account.operatorAddress}</Description>
          <Row>
            <Input
              type='number'
              value={value}
              step={fullGas / 2}
              onChange={(e) => handleChange(e)}
              onKeyDown={(e) => catchKeys(e)}
              style={{ pointerEvents: 'auto' }}
            />
            <ActionButton text='Feed' onClick={feed} size='validator' />
          </Row>
        </ValidatorWrapper>
      );
    }
  );
}

const Description = styled.div`
  color: #333;
  font-family: Pixel;
  font-size: 1.2vh;
  line-height: 1.5vh;
  text-align: center;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin: 0.75vh;
`;

const Input = styled.input`
  background-color: #ffffff;
  border: solid black 0.1vh;
  border-radius: 0.45vh;
  color: black;
  width: 12vh;
  padding: 0.9vh;

  font-family: Pixel;
  font-size: 1.2vh;
  text-align: left;
  text-decoration: none;

  cursor: text;
  justify-content: center;
`;

const Link = styled.div`
  color: #999;
  cursor: pointer;
  padding-bottom: 1.2vh;

  font-family: Pixel;
  font-size: 1.2vh;
  text-decoration: underline;
  text-align: center;

  &:hover {
    color: #11b;
  }
`;
