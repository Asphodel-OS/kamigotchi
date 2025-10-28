import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';
import { formatUnits } from 'viem';
import { useBalance, useWatchBlockNumber } from 'wagmi';

import { ActionButton, IconButton, TextTooltip, ValidatorWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useAccount, useNetwork, useTokens, useVisibility } from 'app/stores';
import { copy } from 'app/utils';
import { TokenIcons } from 'assets/images/tokens';
import { GasConstants, GasExponent } from 'constants/gas';
import { EntityID, EntityIndex } from 'engine/recs';
import { waitForActionCompletion } from 'network/utils';
import { useBridgeOpener } from 'network/utils/hooks';
import { abbreviateAddress } from 'utils/address';
import { playFund, playSuccess } from 'utils/sounds';

export const GasHarasser: UIComponent = {
  id: 'GasHarasser',
  Render: () => {
    const layers = useLayers();
    const { network } = layers;
    const { actions, world } = network;

    const account = useAccount((s) => s.account);
    const validations = useAccount((s) => s.validations);
    const setValidations = useAccount((s) => s.setValidations);

    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const apis = useNetwork((s) => s.apis);
    const networkValidations = useNetwork((s) => s.validations);

    const validators = useVisibility((s) => s.validators);
    const setValidators = useVisibility((s) => s.setValidators);
    const ethBalance = useTokens((s) => s.eth.balance);

    const openBridge = useBridgeOpener();

    const fullGas = GasConstants.Full; // js floating points are retarded
    const [value, setValue] = useState(fullGas);

    /////////////////
    // SUBSCRIPTIONS

    useWatchBlockNumber({
      onBlockNumber: (n) => {
        if (n % 4n === 0n) refetch();
      },
    });

    const { data: operatorBalance, refetch } = useBalance({
      address: account.operatorAddress,
    });

    /////////////////
    // TRACKING

    // run the primary check(s) for this validator, track in store for easy access
    useEffect(() => {
      if (!validations.operatorMatches) return;
      const hasGas = hasEnoughGas(operatorBalance?.value ?? BigInt(0));
      if (hasGas !== validations.operatorHasGas) {
        setValidations({ ...validations, operatorHasGas: hasGas });
      }
    }, [validations.operatorMatches, operatorBalance]);

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

    const needsToBridge = () => {
      return ethBalance < GasConstants.Empty && import.meta.env.MODE !== 'puter';
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
      newValue = Math.min(ethBalance, newValue);
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
        <TextTooltip text={[account.operatorAddress, '(click to copy)']}>
          <Description onClick={() => copy(account.operatorAddress)}>
            Address: {abbreviateAddress(account.operatorAddress)}
          </Description>
        </TextTooltip>
        {needsToBridge() ? (
          <Bridge>
            <Text> Not enough gas. You need to bridge some ETH first.</Text>
            <IconButton img={TokenIcons.init} onClick={openBridge} text={'Bridge ETH'} />
          </Bridge>
        ) : (
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
        )}
      </ValidatorWrapper>
    );
  },
};

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

const Bridge = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  margin-top: 1vw;
`;

const Text = styled.div`
  font-size: 0.75vw;
  margin: 0 0 2vw 0;
  color: red;
`;
