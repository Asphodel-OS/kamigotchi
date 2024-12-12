import { getComponentValue } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { concat, map } from 'rxjs';

import { registerUIComponent } from 'app/root';
import { GodID, SyncState } from 'engine/constants';
import { registerFixtures, registerModals, registerScene } from '..';
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

      return concat([], LoadingState.update$).pipe(
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
        if (state === SyncState.LIVE) {
          // TODO: this is really hacky. move this logic elsewhere on SyncState sub
          console.log('State Live');

          setTimeout(() => {
            console.log('Registering Fixtures');
            registerFixtures();
          }, 1000);
          setTimeout(() => {
            console.log('Registering Scene');
            registerScene();
          }, 1500);
          setTimeout(() => {
            console.log('Registering Modals');
            registerModals();
          }, 2000);
          setTimeout(() => setIsVisible(false), 3333);
        }
      }, [state]);

      const getStatus = () => {
        if (state !== SyncState.LIVE) return msg;
        const rand = Math.random();
        const eEggOdds = 1 / 1e3;

        if (rand < eEggOdds) return 'good luck o7';
        else if (rand < 2 * eEggOdds) return 'play nice now :3';
        else if (rand < 3 * eEggOdds) return 'we are always ._. watching';
        else if (rand < 4 * eEggOdds) return 'behind you..';
        else if (rand < 5 * eEggOdds) return 'enjoy your visit ^^';
        else if (rand < 6 * eEggOdds) return 'S> Fame @@@@@@@ @ @@@@@@@';
        else if (rand < 7 * eEggOdds) return 'kms';
        else return 'transporting you shortly~';
      };

      return <BootScreen status={getStatus()} progress={percentage} isHidden={!isVisible} />;
    }
  );
}
