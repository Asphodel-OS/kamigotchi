import { getComponentValue } from '@mud-classic/recs';
import { concat, map } from 'rxjs';

import { registerUIComponent } from 'app/root';
import { GodID, SyncState } from 'engine/constants';
import { BootScreen } from './BootScreen';

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
        map(() => {
          let loadingState;
          const GodEntityIndex = world.entityToIndex.get(GodID);
          if (GodEntityIndex != null) {
            loadingState = getComponentValue(LoadingState, GodEntityIndex);
          }
          return { loadingState };
        })
      );
    },

    ({ loadingState }) => {
      if (!loadingState) return <BootScreen status='' />;
      if (loadingState.state === SyncState.LIVE) {
        return null;
      }

      const getLoadingMessage = () => {
        if (Math.random() < 1 / 1e3) return 'good luck..';
        return loadingState.msg;
      };

      return <BootScreen status={getLoadingMessage()} progress={loadingState.percentage} />;
    }
  );
}
