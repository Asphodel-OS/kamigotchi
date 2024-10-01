import { getComponentValue } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { concat, map } from 'rxjs';

import { registerUIComponent } from 'app/root';
import { GodID, SyncState } from 'engine/constants';
import { registerModals } from '..';
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

          loadingState = loadingState ?? {
            state: SyncState.CONNECTING,
            msg: 'Connecting to Yominet',
            percentage: 0,
          };
          return { loadingState };
        })
      );
    },

    ({ loadingState }) => {
      const [isVisible, setIsVisible] = useState(true);
      const { state, msg, percentage } = loadingState;

      useEffect(() => {
        if (state === SyncState.CONNECTING) {
          if (performance.getEntriesByName('connecting').length !== 0) return;
          performance.mark('connecting');
        } else if (state === SyncState.SETUP) {
          if (performance.getEntriesByName('setup').length !== 0) return;
          performance.mark('setup');
        } else if (state === SyncState.BACKFILL) {
          if (performance.getEntriesByName('backfill').length !== 0) return;
          performance.mark('backfill');
        } else if (state === SyncState.GAPFILL) {
          if (performance.getEntriesByName('gapfill').length !== 0) return;
          performance.mark('gapfill');
        } else if (state === SyncState.INITIALIZE) {
          if (performance.getEntriesByName('init').length !== 0) return;
          performance.mark('init');
        } else if (state === SyncState.LIVE) {
          if (performance.getEntriesByName('live').length !== 0) return;
          performance.mark('live');
          setTimeout(() => setIsVisible(false), 1500);
          registerModals();
          performance.measure('connection', 'connecting', 'setup');
          performance.measure('setup', 'setup', 'backfill');
          performance.measure('backfill', 'backfill', 'gapfill');
          performance.measure('gapfill', 'gapfill', 'init');
          performance.measure('initialization', 'init', 'live');
          console.log(performance.getEntriesByType('measure'));
        }
      }, [state]);

      const getStatus = () => {
        if (state !== SyncState.LIVE) return msg;
        const rand = Math.random();
        const eeggOdds = 1 / 1e2;

        if (rand < eeggOdds) return 'good luck o7';
        else if (rand < 2 * eeggOdds) return 'play nice now :3';
        else if (rand < 3 * eeggOdds) return 'we are always ._. watching';
        else if (rand < 4 * eeggOdds) return 'behind you..';
        else if (rand < 5 * eeggOdds) return 'enjoy your visit ^^';
        else return 'transporting you shortly~';
      };

      return <BootScreen status={getStatus()} progress={percentage} isHidden={!isVisible} />;
    }
  );
}
