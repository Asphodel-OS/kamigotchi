import { useRef, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { Address, getAddress } from 'viem';

import { EntityID } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { getConfigAddress } from 'app/cache/config';
import { getItemByIndex } from 'app/cache/item';
import { ModalHeader, ModalWrapper, ProgressBar } from 'app/components/library';
import { ActionButton } from 'app/components/library/base/buttons';
import { registerUIComponent } from 'app/root';
import { useNetwork } from 'app/stores';
import { ItemImages } from 'assets/images/items';
import { ONYX_INDEX } from 'constants/items';
import { useERC20Balance, usePresaleInfo } from 'network/chain';
import { useWatchBlockNumber } from 'wagmi';
import { Rate } from './Rate';

export function registerPresaleModal() {
  registerUIComponent(
    'Presale',
    {
      colStart: 33,
      colEnd: 70,
      rowStart: 15,
      rowEnd: 55,
    },

    // Requirement
    (layers) => {
      return interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          return {
            network,
            presaleAddress: getAddress(getConfigAddress(world, components, 'ONYX_PRESALE_ADDRESS')),
            currency: getItemByIndex(world, components, ONYX_INDEX), // onyx placeholder - to change to eth
          };
        })
      );
    },

    // Render
    ({ network, presaleAddress, currency }) => {
      const { selectedAddress, apis } = useNetwork();
      const { actions } = network;

      const [toBuy, setToBuy] = useState<number>(0);
      const [toReceive, setToReceive] = useState<number>(0);
      const inputRef = useRef<HTMLInputElement>(null);

      useWatchBlockNumber({
        onBlockNumber: () => {
          refetchInfo();
          refetchToken();
        },
      });

      /////////////////
      // PRESALE INFO

      const { refetch: refetchInfo, data: presaleData } = usePresaleInfo(
        selectedAddress as Address,
        presaleAddress
      );

      /////////////////
      // TOKEN BALANCES

      const { balances: currencyBal, refetch: refetchToken } = useERC20Balance(
        selectedAddress as Address,
        getAddress(currency.address || '0x0000000000000000000000000000000000000000'),
        presaleAddress
      );

      ////////////////
      // TRANSACTIONS

      const enoughApproval = () => currencyBal.allowance >= toBuy;
      const enoughCurrency = () => currencyBal.balance >= toBuy;

      const approveTx = async () => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);
        const checksumAddr = getAddress(currency.address!);
        const checksumSpender = getAddress(presaleAddress);

        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'Approve token',
          params: [checksumAddr, checksumSpender, toBuy],
          description: `Approve ${toBuy} ${currency.name} to be spent`,
          execute: async () => {
            return api.erc20.approve(checksumAddr, checksumSpender, toBuy);
          },
        });
      };

      const buyTx = async () => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'Buy ONYX Presale',
          params: [toBuy],
          description: `Buying ${toBuy} ONYX via presale`,
          execute: async () => {
            return api.presale.buy(presaleAddress, toBuy);
          },
        });
      };

      const updateInput = (value: number) => {
        setToBuy(value);
        setToReceive(value * presaleData.price);
      };

      ////////////////
      // COMPONENTS

      const MockUpData = () => {
        return (
          <Data>
            <Numbers style={{ marginBottom: `0.2vw` }}>Your allo: {presaleData.allo}</Numbers>
            <Numbers style={{ marginBottom: `0.8vw` }}>You bought: {presaleData.bought}</Numbers>
          </Data>
        );
      };

      const InputBox = () => {
        return (
          <InputButton>
            <Input
              type='number'
              min='0'
              onKeyDown={(e) => {
                if (e.key === '-') e.preventDefault();
              }}
              ref={inputRef}
              onChange={(e) => updateInput(Number(e.target.value))}
            />
            <ActionButton
              text={enoughApproval() ? 'Buy' : 'Approve'}
              disabled={!enoughCurrency()}
              onClick={() => (enoughApproval() ? buyTx() : approveTx())}
            />
          </InputButton>
        );
      };

      /////////////////
      // DISPLAY
      return (
        <ModalWrapper
          id='presale'
          header={<ModalHeader title='Presale' icon={ItemImages.onyx} />}
          canExit
        >
          <Content>
            <ProgressBar current={presaleData.totalDeposits} max={presaleData.depositCap} />
            {MockUpData()}
            <Rate quantityLeft={toBuy} quantityRight={toReceive} />
            {InputBox()}
          </Content>
        </ModalWrapper>
      );
    }
  );
}

const Content = styled.div`
  display: flex;
  justify-content: space-evenly;
  padding: 0.5vw;
  flex-flow: column;
  align-items: center;
  flex-direction: column;
  gap: 0.6vw;
  height: 100%;
`;

const InputButton = styled.div`
  display: flex;
  gap: 0.6vw;
  justify-content: center;
`;

const Input = styled.input`
  line-height: 1.5vw;
  border-radius: 0.15vw;
  width: 50%;
`;

const Data = styled.div`
  margin-left: 12vw;
  font-size: 1vw;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 25ch;
`;

const Numbers = styled.div`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 25ch;
  line-height: 1.2vw;
`;
