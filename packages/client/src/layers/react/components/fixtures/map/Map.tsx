import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';

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
      colStart: 3,
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
      // console.log('mRoom: ', data)
      const [roomObject, setRoomObject] = useState<Room>();
      const { visibleButtons, visibleModals } = dataStore();

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
        merchant: false,
        nameKami: false,
        node: false,
        party: false,
      };

      return (
        <MenuButton
          id='map_button'
          targetDiv='map'
          text='Map'
          hideModals={modalsToHide}
          visible={visibleButtons.map}
        >
          <Wrapper>
            <Image src={mapIcon} alt='map_icon' />
            <Text>{roomObject?.name}</Text>
          </Wrapper>
        </MenuButton>
      );
    }
  );
}


const Wrapper = styled.div`
  width: 100%;
  padding: 1vw 1.1vw;
  gap: .7vw;
  
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const Image = styled.img`
  height: 100%; 
  width: auto;
`;

const Text = styled.div`
  font-size: 1.5vw;
  color: #333;
  font-family: Pixel;
`;