import { EntityID, EntityIndex } from '@mud-classic/recs';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';
import { formatUnits } from 'viem';
import { useBalance, useWatchBlockNumber } from 'wagmi';

import { ActionButton, TextTooltip, ValidatorWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useLayers } from 'app/root/hooks';
import { useAccount, useNetwork, useVisibility } from 'app/stores';
import { copy } from 'app/utils';
import { GasConstants, GasExponent } from 'constants/gas';
import { waitForActionCompletion } from 'network/utils';
import { abbreviateAddress } from 'utils/address';
import { playFund, playSuccess } from 'utils/sounds';

export const GasHarasser: UIComponent = {
  id: 'GasHarasser',
  Render: () => {
      const layers = useLayers();
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
        onBlockNumber: (n) => {
          if (n % 4n === 0n) refetch();
        },
      });

      const { data: balance, refetch } = useBalance({
        address: account.operatorAddress,
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
          description: `Funding Operator ${value.toLocaleString()} ETH`,
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
          id='gasHarasser'
          canExit
          divName='gasHarasser'
          title='Embedded wallet is empty!'
          errorPrimary={`pls feed me pls a crumb of ETH ._.`}
        >
          <GasLink
            key='gas'
            href={`https://www.gas.zip/`}
            target='_blank'
            rel='noopener noreferrer'
            linkColor='#d44c79'
          >
            Not enough gas? Get some here!
          </GasLink>
          <TextTooltip text={[account.operatorAddress, '(click to copy)']}>
            <Description onClick={() => copy(account.operatorAddress)}>
              Address: {abbreviateAddress(account.operatorAddress)}
            </Description>
          </TextTooltip>
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
  },
};

const Description = styled.div`
  color: #333;
  padding: 0.9em 0 0 0;
  font-size: 0.9em;
  line-height: 1.5em;
  text-align: center;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin: 0.75em;
  gap: 0.15em;
`;

const Input = styled.input`
  background-color: #ffffff;
  border: solid black 0.15em;
  border-radius: 0.45em;

  color: black;
  width: 9em;
  height: 1.8em;
  padding: 0.6em;

  font-size: 0.75em;
  text-align: left;
  text-decoration: none;

  cursor: text;
  justify-content: center;
`;

const GasLink = styled.a<{ linkColor?: string }>`
  color: ${({ linkColor }) => linkColor ?? '#0077cc'};
  font-size: 0.8em;
  text-decoration: underline;
  &:hover {
    text-decoration: none;
  }
`;
