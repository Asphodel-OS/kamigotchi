import { useEffect } from 'react';
import styled from 'styled-components';
import { erc20Abi } from 'viem';
import { useReadContracts, useWatchBlockNumber } from 'wagmi';

import { getItemByIndex } from 'app/cache/item';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useNetwork, useTokens } from 'app/stores';
import { Tokens } from 'constants/tokens';
import { getCompAddr } from 'network/shapes/utils';
import { parseTokenBalance } from 'utils/numbers';

export const TokenChecker: UIComponent = {
  id: 'TokenBalances',
  Render: () => {
    const layers = useLayers();

    const { tokenAddresses, spender, utils } = (() => {
      const { network } = layers;
      const { world, components } = network;
      return {
        tokenAddresses: {
          onyx: Tokens.ONYX.address,
          eth: Tokens.ETH.address,
        },
        spender: getCompAddr(world, components, 'component.token.allowance'),
        utils: {
          getItem: (index: number) => getItemByIndex(world, components, index),
        },
      };
    })();

    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const balances = useTokens((s) => s.balances);
    const setToken = useTokens((s) => s.set);
    const setOnyx = useTokens((s) => s.setOnyx);
    const setEth = useTokens((s) => s.setEth);

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
      if (balanceMismatch || allowanceMismatch) {
        setToken(tokenAddresses.eth, { balance, allowance });
        setEth({ balance, allowance });
      }
    }, [ethData]);

    // onyx
    useEffect(() => {
      const oldOnyxData = balances.get(tokenAddresses.onyx);
      const balance = parseTokenBalance(onyxData?.[0].result, 18);
      const allowance = parseTokenBalance(onyxData?.[1].result, 18);

      const balanceMismatch = oldOnyxData?.balance !== balance;
      const allowanceMismatch = oldOnyxData?.allowance !== allowance;
      if (balanceMismatch || allowanceMismatch) {
        setToken(tokenAddresses.onyx, { balance, allowance });
        setOnyx({ balance, allowance });
      }
    }, [onyxData]);

    return <Wrapper style={{ display: 'block' }} />;
  },
};

const Wrapper = styled.div`
  align-items: left;
`;
