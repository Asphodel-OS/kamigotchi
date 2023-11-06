import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';

import { mapIcon } from 'assets/images/icons/menu';
import { MenuButton } from 'layers/react/components/library/MenuButton';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { getRoomByLocation, Room } from 'layers/react/shapes/Room';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore, VisibleModals } from 'layers/react/store/createStore';

export function registerMapButton() {
  registerUIComponent(
    'MapButton',
    {
      colStart: 6,
      colEnd: 30,
      rowStart: 3,
      rowEnd: 10,
    },
    (layers) => {
      const {
        network: {
          components: { Location, OperatorAddress },
        },
      } = layers;

      return merge(Location.update$, OperatorAddress.update$).pipe(
        map(() => {
          const account = getAccountFromBurner(layers);
          return {
            layers,
            data: { account }
          };
        })
      );
    },
    ({ layers, data }) => {
      const [roomObject, setRoomObject] = useState<Room>();
      const { visibleButtons } = dataStore();

      // set selected room location to the player's current one when map modal is opened
      useEffect(() => {
        setRoomObject(getRoomByLocation(layers, data.account.location));
      }, [data?.account.location]);

      const modalsToHide: Partial<VisibleModals> = {
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        emaBoard: false,
        kami: false,
        leaderboard: false,
        nameKami: false,
        party: false,
      };

      return (
        <MenuButton
          id='map_button'
          image={mapIcon}
          tooltip={`Map (${roomObject?.name})`}
          targetDiv='map'
          hideModals={modalsToHide}
          visible={visibleButtons.map}
        />
      );
    }
  );
}