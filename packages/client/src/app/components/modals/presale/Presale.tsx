import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { BigNumber, ethers } from 'ethers';
import { useEffect, useRef, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { Address } from 'viem';

import { getAccount } from 'app/cache/account';
import { getConfigAddress } from 'app/cache/config';
import {
  ActionButton,
  EmptyText,
  ModalHeader,
  ModalWrapper,
  ProgressBar,
  Tooltip,
} from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useNetwork } from 'app/stores';
import { ItemImages } from 'assets/images/items';
import { useERC20Balance } from 'network/chain';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getOwnerAddress } from 'network/shapes/utils/component';
import { waitForActionCompletion } from 'network/utils';
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
          const accountEntity = queryAccountFromEmbedded(network);
          return {
            network,
            data: {
              accountEntity,
              ownerAddress: getOwnerAddress(components, accountEntity),
              onyxPresaleAddress: getConfigAddress(
                world,
                components,
                'ONYX_PRESALE_ADDRESS'
              ) as Address,
            },
            tokens: {
              onyx: getConfigAddress(world, components, 'ONYX_ADDRESS') as Address,
            },
            utils: {
              getAccount: () => getAccount(world, components, accountEntity),
            },
          };
        })
      );
    },

    // Render
    ({ network, data, tokens }) => {
      const { accountEntity, onyxPresaleAddress, ownerAddress } = data;
      const { selectedAddress, signer } = useNetwork();
      const { actions, api, components, world } = network;

      const [isAllowed, setIsAllowed] = useState<boolean>(false);
      const [amount, setAmount] = useState<number>(0);
      const [progress, setProgress] = useState<number>(0);
      const [depositEmpty, setDepositEmpty] = useState<boolean>(true);
      const inputRef = useRef<HTMLInputElement>(null);

      useEffect(() => {
        setTimeout(() => {
          setProgress(presaleBal.balance);
        }, 10000);
      });

      useEffect(() => {
        if (inputRef.current) inputRef.current.value = '';
        checkDeposits();
        checkOnyxAllowance();
        setAmount(0);
      }, [accountEntity]);

      /////////////////
      // PRESALE CONTRACT

      async function getPresaleContract() {
        const erc20Interface = new ethers.utils.Interface([
          'function whitelist(address) view returns (uint256)',
          'function deposits(address) view returns (uint256)',
          'function whitelistDeposit(uint256) external returns (void)',
          'function claim() external returns (uint256)',
          'function withdraw() external returns (uint256)',
        ]);
        const presaleContract = new ethers.Contract(onyxPresaleAddress, erc20Interface, signer);
        return { presaleContract };
      }

      const { balances: presaleBal, refetch: refetchPresale } = useERC20Balance(
        onyxPresaleAddress,
        tokens.onyx
      );
      /////////////////
      // ONYX CONTRACT
      // TODO: in the future change this to ETH
      //addresses :accountowner and onyx  using onyxpresale as spender
      const { balances: onyxBal, refetch: refetchOnyx } = useERC20Balance(
        getAccount(world, components, accountEntity).ownerAddress as Address,
        tokens.onyx,
        onyxPresaleAddress
      );

      async function checkOnyxAllowance() {
        const { presaleContract } = await getPresaleContract();
        try {
          if (
            BigNumber.from(onyxBal.allowance).gte(await presaleContract.whitelist(ownerAddress))
          ) {
            setIsAllowed(true);
          } else {
            setIsAllowed(false);
          }
        } catch (error: any) {
          setIsAllowed(false);
          throw new Error(`Approval failed: ${error.message}`);
        }
      }

      const approveTx = () => {
        if (!api) {
          setIsAllowed(false);
          return console.error(`API not established for ${selectedAddress}`);
        }
        const actionID = uuid() as EntityID;
        actions!.add({
          id: actionID,
          action: 'ApprovePresale',
          params: [],
          description: `Approving ${onyxBal.balance} ONYX`,
          execute: async () => {
            return api.player.erc20.approve(tokens.onyx, onyxPresaleAddress);
          },
        });
        return actionID;
      };

      const handleApproveTx = async () => {
        try {
          const approveActionID = approveTx();
          if (!approveActionID) {
            setIsAllowed(false);
            throw new Error('Presale approve action failed');
          }
          await waitForActionCompletion(
            actions!.Action,
            world.entityToIndex.get(approveActionID) as EntityIndex
          );
          setIsAllowed(true);
        } catch (e) {
          console.log('Presale.tsx: handleApproveTx() failed', e);
        }
      };

      const checkUserBalance = async (amount: number) => {
        const { presaleContract } = await getPresaleContract();
        presaleContract.whitelistDeposit(amount);
        if (onyxBal.balance >= amount) {
          const { presaleContract } = await getPresaleContract();
          if (
            presaleContract.whitelist(ownerAddress) - presaleContract.deposits(ownerAddress) >=
            amount
          ) {
            presaleContract.whitelistDeposit(amount);
            setDepositEmpty(false);
          }
        }
      };

      const withdraw = async () => {
        const { presaleContract } = await getPresaleContract();
        presaleContract.withdraw();
        setDepositEmpty(true);
      };

      const checkDeposits = async () => {
        const { presaleContract } = await getPresaleContract();
        setDepositEmpty(presaleContract.deposits(ownerAddress).then((n: BigNumber) => n.eq(0)));
      };

      const MockUpData = () => {
        return (
          <Data>
            <Tooltip text={['Allowance: 0']}>
              <Numbers style={{ marginBottom: `0.2vw` }}>Allowance: 0</Numbers>
            </Tooltip>
            <Tooltip text={['Deposits: 0']}>
              <Numbers style={{ marginBottom: `0.8vw` }}>Deposits: 0</Numbers>
            </Tooltip>
          </Data>
        );
      };

      const onClick = () =>
        isAllowed ? checkUserBalance(amount) : (checkOnyxAllowance(), handleApproveTx());

      const FlattenedInput = () => {
        return (
          <InputButton>
            <Input
              type='number'
              min='0'
              onKeyDown={(e) => {
                if (e.key === '-') e.preventDefault();
              }}
              ref={inputRef}
              disabled={!isAllowed}
              onChange={(e) => {
                setAmount(Number(e.target.value));
              }}
            />
            <ActionButton
              text={!isAllowed ? 'Approve' : 'Buy'}
              disabled={amount <= 0}
              onClick={() => {
                onClick();
              }}
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
          {!accountEntity ? (
            <EmptyText text={['Failed to Connect Account']} size={1} />
          ) : (
            <>
              <Content>
                <ProgressBar current={progress} max={1000} />
                <div
                  style={{
                    marginBottom: `2vw;`,
                    display: `flex`,
                    flexDirection: `column`,
                    alignItems: `center`,
                  }}
                >
                  {MockUpData()}
                  <Rate quantityLeft={amount} quantityRight={amount * 1000} />
                  {FlattenedInput()}
                </div>
                <Button
                  disabled={depositEmpty}
                  onClick={() => {
                    withdraw();
                  }}
                >
                  Withdraw
                </Button>
              </Content>
            </>
          )}
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

const Button = styled.button`
  border-color: black;
  position: absolute;
  right: 1vw;
  bottom: 1vw;
  font-size: 0.8vw;
  border-radius: 0.45vw;
  border-width: 0.15vw;
  background-color: white;
  color: black;
  width: fit-content;
  padding: 0.4vw 0.8vw;
  cursor: pointer;
  &:disabled {
    background-color: rgb(178, 178, 178);
  }
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
