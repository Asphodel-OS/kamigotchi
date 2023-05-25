import React, { useEffect } from 'react';
import { map, merge } from 'rxjs';
import { EntityID, Has, HasValue, runQuery } from '@latticexyz/recs';

import { getCurrentRoom } from 'layers/phaser/utils';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import MapGrid from '../library/MapGrid';

export function registerMapModal() {
  registerUIComponent(
    'WorldMap',
    {
      colStart: 69,
      colEnd: 100,
      rowStart: 64,
      rowEnd: 99,
    },
    (layers) => {
      const {
        network: {
          api: { player },
          network: { connectedAddress },
          components: { IsAccount, Location, OperatorAddress },
          actions,
        },
      } = layers;

      return merge(Location.update$, OperatorAddress.update$).pipe(
        map(() => {
          // get the account entity of the controlling wallet
          const accountEntityIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(OperatorAddress, {
                value: connectedAddress.get(),
              }),
            ])
          )[0];

          const currentRoom = getCurrentRoom(Location, accountEntityIndex);
          return {
            actions,
            api: player,
            data: { currentRoom },
          };
        })
      );
    },
    ({ actions, api, data }) => {
      const { visibleModals } = dataStore();

      useEffect(() => {
        if (visibleModals.map === true)
          document.getElementById('world_map')!.style.display = 'block';
      }, [visibleModals.map]);

      ///////////////////
      // ACTTONS

      const move = (location: number) => {
        const actionID = `Moving to room ${location}` as EntityID;

        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.account.move(location);
          },
        });
      };

      ///////////////////
      // DISPLAY

      return (
        <ModalWrapperFull id='world_map' divName='map'>
          <MapGrid highlightedRoom={data.currentRoom} move={move} />
        </ModalWrapperFull>
      );
    }
  );
}
