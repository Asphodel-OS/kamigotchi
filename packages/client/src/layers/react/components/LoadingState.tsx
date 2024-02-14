import { GodID, SyncState } from '@latticexyz/network';
import { getComponentValue } from '@latticexyz/recs';
import { concat, map } from 'rxjs';

import { BootScreen } from 'layers/react/engine/components';
import { registerUIComponent } from 'layers/react/engine/store';

export function registerLoadingState() {
  registerUIComponent(
    'LoadingState',
    {
      rowStart: 1,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
    },
    (layers) => {
      const {
        components: { LoadingState },
        world,
      } = layers.network;

      return concat([1], LoadingState.update$).pipe(
        map(() => ({
          LoadingState,
          world,
        }))
      );
    },

    ({ LoadingState, world }) => {
      const GodEntityIndex = world.entityToIndex.get(GodID);
      const loadingState =
        GodEntityIndex == null ? null : getComponentValue(LoadingState, GodEntityIndex);

      // percentage display when loading blocks from RPC
      const getProgressString = () => {
        if (loadingState == null) return;
        if (loadingState.percentage == 100 || loadingState.percentage == 0) return;
        return `  (${loadingState.percentage.toFixed(1)}%)`;
      };

      if (loadingState == null) return <BootScreen>Connecting</BootScreen>;
      if (loadingState.state === SyncState.LIVE) return null;
      return (
        <BootScreen>
          {loadingState.msg} {getProgressString()}
        </BootScreen>
      );
    }
  );
}
