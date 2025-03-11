import { interval, map } from 'rxjs';

import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { getAccount } from 'app/cache/account';
import { getConfigAddress } from 'app/cache/config';
import { ActionButton, EmptyText, ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useNetwork } from 'app/stores';
import { ItemImages } from 'assets/images/items';
import { BigNumber, ethers } from 'ethers';
import { useERC20Balance } from 'network/chain';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getOwnerAddress } from 'network/shapes/utils/component';
import { waitForActionCompletion } from 'network/utils';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Address } from 'viem';

import { ProgressBar } from 'app/components/library';
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
    ({ network, data, utils, tokens }) => {
      const { accountEntity, onyxPresaleAddress, ownerAddress } = data;
      const { selectedAddress, apis, signer } = useNetwork();
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

      // comment this if you want to check the approval button
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

      /////////////////
      // ONYX CONTRACT
      // TODO: in the future change this to ETH
      //addresses :accountowner and onyx  using onyxpresale as spender
      const { balances: onyxBal, refetch: refetchOnyx } = useERC20Balance(
        getAccount(world, components, accountEntity).ownerAddress as Address,
        tokens.onyx,
        onyxPresaleAddress
      );

      const { balances: presaleBal, refetch: refetchPresale } = useERC20Balance(
        onyxPresaleAddress,
        tokens.onyx
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
            <div style={{ marginBottom: `0.5vw` }}> Allowance: 0 </div>
            <div>Deposits: 0 </div>
          </Data>
        );
      };

      const onClick = () =>
        isAllowed ? checkUserBalance(amount) : (checkOnyxAllowance(), handleApproveTx());

      const FlattenedInput = () => {
        return (
          <InputButton>
            <Input
              ref={inputRef}
              disabled={!isAllowed}
              onKeyDown={(e) => {
                if (isNaN(Number(e.key))) {
                  if (
                    e.key !== 'Backspace' &&
                    e.key !== 'Delete' &&
                    e.key !== 'ArrowLeft' &&
                    e.key !== 'ArrowRight' &&
                    e.key !== 'ArrowUp' &&
                    e.key !== 'ArrowDown' &&
                    e.key !== '.'
                  )
                    e.preventDefault();
                }
              }}
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
                <ProgressBar current={progress} max={1000} /> <MockUpData />
                <Rate quantityLeft={amount} quantityRight={amount * 1000} />
                {FlattenedInput()}
                <Button
                  style={{ position: `absolute`, right: `1vw`, bottom: `1vw` }}
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
  gap: 0.6vw;
  padding: 0.5vw;
  width: 100%;
  height: 100%;
  flex-flow: column;
  overflow: hidden auto;
  align-items: center;
  flex-direction: column;
`;

const InputButton = styled.div`
  display: flex;
  gap: 0.6vw;
`;

const Input = styled.input`
  line-height: 1.5vw;
  border-radius: 0.15vw;
  width: 50%;
`;

const Button = styled.button`
  border-radius: 0.15vw;
  background-color: white;
  width: fit-content;
  padding: 0.1vw;
  &:disabled {
    background-color: rgb(215 215 215);
    cursor: auto;
  }
`;

const Data = styled.div`
  left: 30%;
  top: 30%;
`;
