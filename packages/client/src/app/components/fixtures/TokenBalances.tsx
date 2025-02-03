import styled from 'styled-components';

import { map, merge } from 'rxjs';
import { Address } from 'viem';
import { useWatchBlockNumber } from 'wagmi';

import { getConfigAddress } from 'app/cache/config';
import { registerUIComponent } from 'app/root';
import { useAccount, useTokens } from 'app/stores';
import { useERC20Balance } from 'network/chain';

export function registerTokenBalances() {
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

      return merge(actions.Action.update$, LoadingState.update$).pipe(
        map(() => {
          const { world, components } = network;

          return {
            tokens: {
              onyx: getConfigAddress(world, components, 'ONYX_ADDRESS') as Address,
            },
          };
        })
      );
    },
    ({ tokens }) => {
      const { account } = useAccount();
      const { setOnyx, setInit } = useTokens();

      // doesn't seem to work reliably - updates upon Action for additional trigger
      useWatchBlockNumber({
        onBlockNumber: () => {
          refetchOnyx();
          setOnyx(onyxBal);
        },
      });

      const { balances: onyxBal, refetch: refetchOnyx } = useERC20Balance(
        account.ownerAddress as Address,
        tokens.onyx,
        '0x0000000000000000000000000000000000000000' // todo: get address of TokenAllowanceComponent
      );

      return <Wrapper style={{ display: 'block' }}></Wrapper>;
    }
  );
}

const Wrapper = styled.div`
  align-items: left;
`;
