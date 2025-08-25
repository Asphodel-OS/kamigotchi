import { useEffect } from 'react';
import styled from 'styled-components';
import { erc20Abi } from 'viem';
import { useReadContracts, useWatchBlockNumber } from 'wagmi';

import { getItemByIndex } from 'app/cache/item';
import { UIComponent } from 'app/root/types';
import { useLayers } from 'app/root/hooks';
import { useNetwork, useTokens } from 'app/stores';
import { ETH_INDEX, ONYX_INDEX } from 'constants/items';
import { getCompAddr } from 'network/shapes/utils';
import { parseTokenBalance } from 'utils/numbers';

export const TokenChecker: UIComponent = {
  id: 'TokenBalances',
  Render: () => {
      const layers = useLayers();

      const {
        tokenAddresses,
        spender,
        utils: {
          getItem,
        }
      } = (() => {
        const { network } = layers;
        const { world, components } = network;
        return {
          tokenAddresses: {
            // todo: dynamically query based on items with address?
            onyx: getItemByIndex(world, components, ONYX_INDEX).address!,
            eth: getItemByIndex(world, components, ETH_INDEX).address!,
          },
          spender: getCompAddr(world, components, 'component.token.allowance'),
          utils: {
            getItem: (index: number) => getItemByIndex(world, components, index),
          },
        };
      })();

      const { selectedAddress } = useNetwork();
      const { balances, set, setOnyx } = useTokens();

      useWatchBlockNumber({
        onBlockNumber(block) {
          if (block % 2n === 0n) {
            refetchOnyx();
            refetchEth();
          }
        },
      });

      /////////////////
      // ONYX SUB

      const onyxConfig = {
        address: tokenAddresses.onyx,
        abi: erc20Abi,
      };

      const { data: onyxData, refetch: refetchOnyx } = useReadContracts({
        contracts: [
          { ...onyxConfig, functionName: 'balanceOf', args: [selectedAddress] },
          { ...onyxConfig, functionName: 'allowance', args: [selectedAddress, spender] },
        ],
      });

      /////////////////
      // ETH SUB

      const ethConfig = {
        address: tokenAddresses.eth,
        abi: erc20Abi,
      };

      const { data: ethData, refetch: refetchEth } = useReadContracts({
        contracts: [
          { ...ethConfig, functionName: 'balanceOf', args: [selectedAddress] },
          { ...ethConfig, functionName: 'allowance', args: [selectedAddress, spender] },
        ],
      });

      /////////////////
      // STORE UPDATES

      // eth
      useEffect(() => {
        const oldEthData = balances.get(tokenAddresses.eth);
        const balance = parseTokenBalance(ethData?.[0].result, 18);
        const allowance = parseTokenBalance(ethData?.[1].result, 18);

        const balanceMismatch = oldEthData?.balance !== balance;
        const allowanceMismatch = oldEthData?.allowance !== allowance;
        if (balanceMismatch || allowanceMismatch) set(tokenAddresses.eth, { balance, allowance });
      }, [ethData]);

      // onyx
      useEffect(() => {
        const oldOnyxData = balances.get(tokenAddresses.onyx);
        const balance = parseTokenBalance(onyxData?.[0].result, 18);
        const allowance = parseTokenBalance(onyxData?.[1].result, 18);

        const balanceMismatch = oldOnyxData?.balance !== balance;
        const allowanceMismatch = oldOnyxData?.allowance !== allowance;
        if (balanceMismatch || allowanceMismatch) {
          setOnyx({ balance, allowance });
          set(tokenAddresses.onyx, { balance, allowance });
        }
      }, [onyxData]);

      return <Wrapper style={{ display: 'block' }} />;
  },
};

const Wrapper = styled.div`
  align-items: left;
`;
