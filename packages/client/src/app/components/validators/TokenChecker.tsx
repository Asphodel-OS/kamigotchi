import styled from 'styled-components';

import { interval, map, merge } from 'rxjs';
import { useWatchBlockNumber } from 'wagmi';

import { getItemByIndex } from 'app/cache/item';
import { registerUIComponent } from 'app/root';
import { useNetwork, useTokens } from 'app/stores';
import { ETH_INDEX, ONYX_INDEX } from 'constants/items';
import { useERC20Balance } from 'network/chain';
import { getCompAddr } from 'network/shapes/utils';

export function registerTokenChecker() {
  registerUIComponent(
    'TokenBalances',
    {
      colStart: 0,
      colEnd: 0,
      rowStart: 0,
      rowEnd: 0,
    },
    (layers) => {
      const { network } = layers;
      const { actions, components } = network;
      const { LoadingState } = components;

      return merge(actions.Action.update$, LoadingState.update$, interval(1500)).pipe(
        map(() => {
          const { world, components } = network;
          return {
            tokenAddresses: {
              // todo: dynamically query based on items with address?
              onyx: getItemByIndex(world, components, ONYX_INDEX).address!,
              eth: getItemByIndex(world, components, ETH_INDEX).address!,
            },
            spender: getCompAddr(world, components, 'component.token.allowance'),
          };
        })
      );
    },
    ({ tokenAddresses, spender }) => {
      const { selectedAddress } = useNetwork();
      const { set } = useTokens();

      useWatchBlockNumber({
        onBlockNumber(block) {
          if (block % 2n === 0n) {
            refetchOnyx();
            refetchEth();
            set(tokenAddresses.onyx, onyxBal);
            set(tokenAddresses.eth, ethBal);
          }
        },
      });

      const { balances: onyxBal, refetch: refetchOnyx } = useERC20Balance(
        selectedAddress,
        tokenAddresses.onyx,
        spender
      );

      const { balances: ethBal, refetch: refetchEth } = useERC20Balance(
        selectedAddress,
        tokenAddresses.eth,
        spender
      );

      return <Wrapper style={{ display: 'block' }} />;
    }
  );
}

const Wrapper = styled.div`
  align-items: left;
`;
