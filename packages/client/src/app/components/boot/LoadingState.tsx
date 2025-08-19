import { getComponentValue } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { concat, map } from 'rxjs';

import { processKamiConfig } from 'app/cache/config';
import { initializeItems } from 'app/cache/item';
import { initializeSkills } from 'app/cache/skills';
import { UIComponent } from 'app/root/types';
import { GodID, SyncState } from 'engine/constants';
import { BootScreen } from './BootScreen';

const FE_DISABLED = import.meta.env.VITE_STATE === 'DISABLED';

export const LoadingState: UIComponent = {
  id: 'LoadingState',
  requirement: (layers) => {
    const { components, world } = layers.network;
    const { LoadingState } = components;

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
        return {
          loadingState,
          utils: {
            initializeKamiConfig: () => processKamiConfig(world, components),
            initializeItems: () => initializeItems(world, components),
            initializeSkills: () => initializeSkills(world, components),
          },
        };
      })
    );
  },
  Render: ({ loadingState, utils }) => {
    const [isVisible, setIsVisible] = useState(true);
    const { state, msg, percentage } = loadingState;
    const { initializeItems, initializeKamiConfig, initializeSkills } = utils;

    useEffect(() => {
      if (FE_DISABLED) return;

      if (state === SyncState.LIVE) {
        setTimeout(() => setIsVisible(false), 1000);
        initializeItems();
        initializeKamiConfig();
        initializeSkills();
      }
    }, [state]);

    const getStatus = () => {
      if (FE_DISABLED) return `Playtest is over 🎉 we'll see you again soon ^^`;

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

    return (
      <BootScreen
        status={getStatus()}
        progress={percentage}
        isHidden={!FE_DISABLED && !isVisible}
      />
    );
  },
};
