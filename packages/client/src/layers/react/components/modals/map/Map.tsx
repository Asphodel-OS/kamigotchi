import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import { EntityID } from '@latticexyz/recs';

import { RoomInfo } from './RoomInfo';
import { mapIcon } from 'assets/images/icons/menu';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { Room, getRoomByLocation } from 'layers/react/shapes/Room';
import { dataStore } from 'layers/react/store/createStore';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';


export function registerMapModal() {
  registerUIComponent(
    'WorldMap',
    {
      colStart: 2,
      colEnd: 33,
      rowStart: 8,
      rowEnd: 60,
    },
    (layers) => {
      const {
        network: {
          api: { player },
          components: { Location, OperatorAddress },
          actions,
        },
      } = layers;

      return merge(Location.update$, OperatorAddress.update$).pipe(
        map(() => {
          const account = getAccountFromBurner(layers);
          return {
            layers,
            actions,
            api: player,
            data: { account }
          };
        })
      );
    },
    ({ layers, actions, api, data }) => {
      // console.log('mRoom: ', data)
      const { room, setRoom } = useSelectedEntities();
      const { visibleModals } = dataStore();
      const [selectedRoom, setSelectedRoom] = useState<Room>();
      const [selectedExits, setSelectedExits] = useState<Room[]>([]);


      /////////////////
      // DATA FETCHING

      // set selected room location to the player's current one when map modal is opened
      useEffect(() => {
        if (visibleModals.map) setRoom(data.account.location)
      }, [visibleModals.map]);

      // update the selected room details
      useEffect(() => {
        if (room) {
          const roomObject = getRoomByLocation(layers, room, { players: true });
          setSelectedRoom(roomObject);

          const exits = (roomObject.exits)
            ? roomObject.exits.map((exit) => getRoomByLocation(layers, exit))
            : [];
          setSelectedExits(exits);
        }
      }, [room, data.account]);


      ///////////////////
      // ACTIONS

      const move = (location: number) => {
        const room = getRoomByLocation(layers, location);
        const actionID = `Moving to ${room.name}` as EntityID;
        actions?.add({
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
        <ModalWrapperFull
          id='world_map'
          divName='map'
          header={<ModalHeader title={selectedRoom?.name ?? 'Map'} icon={mapIcon} />}
          canExit
        >
          <RoomInfo room={selectedRoom} exits={selectedExits} move={move} />
        </ModalWrapperFull>
      );
    }
  );
}