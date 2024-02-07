import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';

import { mapIcon } from 'assets/images/icons/menu';
import { MenuButton } from 'layers/react/components/library/MenuButton';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { getRoomByLocation, Room } from 'layers/network/shapes/Room';
import { registerUIComponent } from 'layers/react/engine/store';
import { useVisibility, Modals } from 'layers/react/store/visibility';

export function registerMapButton() {
  registerUIComponent(
    'MapButton',
    {
      colStart: 9,
      colEnd: 12,
      rowStart: 3,
      rowEnd: 6,
    },
    (layers) => {
      const { network } = layers;
      const { Location, OperatorAddress } = network.components;

      return merge(Location.update$, OperatorAddress.update$).pipe(
        map(() => {
          const account = getAccountFromBurner(network);
          return {
            network,
            data: { account }
          };
        })
      );
    },
    ({ network, data }) => {
      const [_, setRoomObject] = useState<Room>();
      const { buttons } = useVisibility();

      // set selected room location to the player's current one when map modal is opened
      useEffect(() => {
        setRoomObject(getRoomByLocation(network, data.account.location));
      }, [data?.account.location]);

      const modalsToHide: Partial<Modals> = {
        account: false,
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
          tooltip={`Map`}
          targetDiv='map'
          hideModals={modalsToHide}
          visible={buttons.map}
        />
      );
    }
  );
}