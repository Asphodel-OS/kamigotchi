import { interval, map } from 'rxjs';

import { getAccount } from 'app/cache/account';
import { EmptyText, ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useNetwork } from 'app/stores';
import { ItemImages } from 'assets/images/items';
import { BigNumber, ethers } from 'ethers';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getConfigFieldValueAddress } from 'network/shapes/Config';
import { getOwnerAddress } from 'network/shapes/utils/component';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Bar } from './Bar';

export function registerPresaleModal() {
  registerUIComponent(
    'Presale',
    {
      colStart: 33,
      colEnd: 70,
      rowStart: 15,
      rowEnd: 35,
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
              onyxAddress: getConfigFieldValueAddress(world, components, 'ONYX_ADDRESS'),
              onyxPresaleAddress: getConfigFieldValueAddress(
                world,
                components,
                'ONYX_PRESALE_ADDRESS'
              ),
            },
            utils: {
              getAccount: () => getAccount(world, components, accountEntity),
            },
          };
        })
      );
    },

    // Render
    ({ network, data, utils }) => {
      const { actions, api } = network;
      const { accountEntity, onyxAddress, onyxPresaleAddress, ownerAddress } = data;
      const { selectedAddress, apis, signer } = useNetwork();

      const [isAllowed, setIsAllowed] = useState<boolean>(false);
      const [enoughBalance, setEnoughBalance] = useState<boolean>(false);
      const [amount, setAmount] = useState<BigNumber>(BigNumber.from(0));
      const [progress, setProgress] = useState<number>(0);
      const [depositEmpty, setDepositEmpty] = useState<boolean>(true);
      const inputRef = useRef<HTMLInputElement>(null);

      useEffect(() => {
        setTimeout(() => {
          getProgress();
        }, 10000);
      });

      // comment this if you want to check the approval button
      useEffect(() => {
        if (inputRef.current) inputRef.current.value = '';
        checkDeposits();
        checkOnyxAllowance();
        setAmount(BigNumber.from(0));
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

      async function getOnyxContract() {
        const erc20Interface = new ethers.utils.Interface([
          'function allowance(address owner, address spender) view returns (uint256)',
          'function approve(address spender, uint256 amount) returns (bool)',
          'function balanceOf(address account) view returns (uint256)',
        ]);

        const onyxContract = new ethers.Contract(onyxAddress, erc20Interface, signer);

        return { onyxContract };
      }

      async function checkOnyxAllowance() {
        const { onyxContract } = await getOnyxContract();
        const { presaleContract } = await getPresaleContract();
        try {
          const allowance = await onyxContract.allowance(ownerAddress, onyxPresaleAddress);
          if (allowance.gte(await presaleContract.whitelist(ownerAddress))) {
            setIsAllowed(true);
          } else {
            setIsAllowed(false);
          }
        } catch (error: any) {
          setIsAllowed(false);
          throw new Error(`Approval failed: ${error.message}`);
        }
      }

      async function checkUserBalance(amount: ethers.BigNumber) {
        const { onyxContract } = await getOnyxContract();
        try {
          const balance = await onyxContract.balanceOf(ownerAddress);
          setEnoughBalance(balance.gte(amount));
        } catch (error: any) {
          setEnoughBalance(false);
          throw new Error(`Balance check failed: ${error.message}`);
        }
      }

      const approveTx = async () => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);
        const { onyxContract } = await getOnyxContract();
        const balance = await onyxContract.balanceOf(ownerAddress);
        console.log(`about to approve $`);
        const tx = await onyxContract.approve(onyxPresaleAddress, balance);
        await tx.wait();
        console.log(`approved $`);
        if (tx.wait().status === 1) {
          setIsAllowed(true);
        } else {
          setIsAllowed(false);
        }
      };

      const handleBalance = async (amount: ethers.BigNumber) => {
        checkUserBalance(amount);
        if (enoughBalance) {
          const { presaleContract } = await getPresaleContract();
          if (
            presaleContract.whitelist(ownerAddress) - presaleContract.deposits(ownerAddress) >=
            Number(amount)
          ) {
            presaleContract.whitelistDeposit(amount);
            setDepositEmpty(false);
          }
        }
      };

      const getProgress = async () => {
        const { onyxContract } = await getOnyxContract();
        onyxContract.balanceOf(onyxPresaleAddress);
        setProgress(progress / 1000);
      };

      const widthdraw = async () => {
        const { presaleContract } = await getPresaleContract();
        presaleContract.widthdraw();
        setDepositEmpty(true);
      };

      const checkDeposits = async () => {
        const { presaleContract } = await getPresaleContract();
        setDepositEmpty(presaleContract.deposits(ownerAddress).then((n: BigNumber) => n.eq(0)));
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
                <Bar progress={progress} />
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
                          e.key !== 'ArrowDown'
                        )
                          e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      setAmount(BigNumber.from(e.target.value));
                    }}
                  />
                  {!isAllowed ? (
                    <Button
                      onClick={() => {
                        checkOnyxAllowance();
                        approveTx();
                      }}
                    >
                      Approve
                    </Button>
                  ) : (
                    <Button
                      disabled={amount <= BigNumber.from(0)}
                      onClick={() => {
                        handleBalance(amount);
                      }}
                    >
                      Buy
                    </Button>
                  )}
                </InputButton>
                <Button
                  style={{ position: `absolute`, right: `1vw`, bottom: `1vw` }}
                  disabled={depositEmpty}
                  onClick={() => {
                    widthdraw();
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
  line-height: 0.8vw;
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
