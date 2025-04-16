import styled from 'styled-components';

import { map, merge } from 'rxjs';
import { useWatchBlockNumber } from 'wagmi';

import { getItemByIndex } from 'app/cache/item';
import { registerUIComponent } from 'app/root';
import { useAccount, useTokens } from 'app/stores';
import { ONYX_INDEX } from 'constants/items';
import { useERC20Balance } from 'network/chain';
import { getCompAddr } from 'network/shapes/utils';

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
              // todo: dynamically query based on items with address?
              onyx: getItemByIndex(world, components, ONYX_INDEX).address!,
            },
            spender: getCompAddr(world, components, 'component.token.allowance'),
          };
        })
      );
    },
    ({ tokens, spender }) => {
      const { account } = useAccount();
      const { balances, set } = useTokens();

      useWatchBlockNumber({
        onBlockNumber(block) {
          if (block % 4n === 0n) {
            refetchOnyx();
            set(tokens.onyx, onyxBal);
          }
        },
      });

      // useEffect(() => {
      //   console.log('onyx bal', balances.get(tokens.onyx));
      // }, [balances]);

      const { balances: onyxBal, refetch: refetchOnyx } = useERC20Balance(
        account.ownerAddress,
        tokens.onyx,
        spender
      );

      return <Wrapper style={{ display: 'block' }}></Wrapper>;
    }
  );
}

const Wrapper = styled.div`
  align-items: left;
`;
