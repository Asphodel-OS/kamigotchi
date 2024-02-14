import { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';

import { mapIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { getRoomByIndex, Room } from 'layers/network/shapes/Room';
import { MenuButton } from 'layers/react/components/library/MenuButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { Modals, useVisibility } from 'layers/react/store/visibility';

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
      const { RoomIndex, OperatorAddress } = network.components;

      return merge(RoomIndex.update$, OperatorAddress.update$).pipe(
        map(() => {
          const account = getAccountFromBurner(network);
          return {
            network,
            data: { account },
          };
        })
      );
    },
    ({ network, data }) => {
      const [_, setRoomObject] = useState<Room>();
      const { buttons } = useVisibility();

      // set selected room roomIndex to the player's current one when map modal is opened
      useEffect(() => {
        setRoomObject(getRoomByIndex(network, data.account.roomIndex));
      }, [data?.account.roomIndex]);

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
