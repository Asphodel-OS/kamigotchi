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
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Bar } from './Bar';

export function registerPresaleModal() {
  registerUIComponent(
    'Presale',
    {
      colStart: 33,
      colEnd: 70,
      rowStart: 15,
      rowEnd: 85,
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

      /////////////////
      // PRESALE CONTRACT

      async function getPresaleContract() {
        const erc20Interface = new ethers.utils.Interface([
          'function whitelist(address) view returns (uint256)',
          'function deposits(address) view returns (uint256)',
          'function whitelistDeposit(uint256) external returns (void)',
          'function claim() external returns (uint256)',
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
            approveTx();
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

      const handleApproval = () => {
        checkOnyxAllowance();
      };
      const handleBalance = async (amount: ethers.BigNumber) => {
        checkUserBalance(amount);
        if (enoughBalance) {
          const { presaleContract } = await getPresaleContract();
          if (
            presaleContract.whiteList(ownerAddress) - presaleContract.deposits(ownerAddress) >=
            Number(amount)
          ) {
            presaleContract.whiteListDeposit(amount);
          }
        }
      };

      const getProgress = async () => {
        const { onyxContract } = await getOnyxContract();
        onyxContract.balanceOf(onyxPresaleAddress);
        setProgress(progress);
      };

      /////////////////
      // DISPLAY
      useEffect(() => {
        setTimeout(() => {
          getProgress();
        }, 10000);
      });
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
                        handleApproval();
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
  line-height: 0.6vw;
  border-radius: 0.3vw;
  width: 50%;
`;

const Button = styled.button`
  border-radius: 0.3vw;
  background-color: white;
  width: fit-content;
  padding: 0.1vw;
`;
