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
import { useState } from 'react';
import styled from 'styled-components';

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
      const threshold = BigNumber.from(5);

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
        const contractAddress = onyxPresaleAddress;
        return { onyxContract, contractAddress };
      }

      async function checkOnyxAllowance(threshold: ethers.BigNumber) {
        const { onyxContract, contractAddress } = await getOnyxContract();
        try {
          const allowance = await onyxContract.allowance(ownerAddress, contractAddress);
          if (allowance.gte(threshold)) {
            setIsAllowed(true);
          } else {
            setIsAllowed(false);
          }
        } catch (error: any) {
          setIsAllowed(false);
          throw new Error(`Approval failed: ${error.message}`);
        }
      }

      async function checkUserBalance(threshold: ethers.BigNumber) {
        const { onyxContract } = await getOnyxContract();
        try {
          const balance = await onyxContract.balanceOf(ownerAddress);
          setEnoughBalance(balance.gte(threshold));
        } catch (error: any) {
          setEnoughBalance(false);
          throw new Error(`Balance check failed: ${error.message}`);
        }
      }

      const approveTx = async () => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);
        const { onyxContract, contractAddress } = await getOnyxContract();
        const balance = await onyxContract.balanceOf(ownerAddress);
        const tx = await onyxContract.approve(contractAddress, balance);
        await tx.wait();
        if (tx.wait().status === 1) {
          setIsAllowed(true);
        } else {
          setIsAllowed(false);
        }
      };

      const handleClick = () => {
        checkOnyxAllowance(threshold);
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
            <Content>
              <button
                onClick={() => {
                  handleClick();
                }}
              >
                Presale
              </button>
            </Content>
          )}
        </ModalWrapper>
      );
    }
  );
}

const Content = styled.div`
  display: flex;
  flex-flow: wrap;
  -webkit-box-pack: start;
  justify-content: flex-start;
  gap: 0.6vw;
  padding: 0.5vw;
  width: 100%;
  height: 100%;
  flex-wrap: nowrap;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
`;
