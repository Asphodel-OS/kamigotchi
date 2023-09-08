import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import { EntityID } from '@latticexyz/recs';

import { MapGrid } from './MapGrid';
import { RoomInfo } from './RoomInfo';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { Room, getRoomByLocation } from 'layers/react/shapes/Room';
import { dataStore } from 'layers/react/store/createStore';


export function registerMapModal() {
  registerUIComponent(
    'WorldMap',
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 13,
      rowEnd: 99,
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
      const { selectedEntities, setSelectedEntities } = dataStore();
      const { visibleModals } = dataStore();
      const [selectedRoom, setSelectedRoom] = useState<Room>();
      const [selectedExits, setSelectedExits] = useState<Room[]>([]);


      /////////////////
      // DATA FETCHING

      // set selected room location to the player's current one when map modal is opened
      useEffect(() => {
        if (visibleModals.map) {
          setSelectedEntities({ ...selectedEntities, room: data.account.location * 1 });
        }
      }, [visibleModals.map]);

      // update the selected room details
      useEffect(() => {
        if (selectedEntities.room) {
          const room = getRoomByLocation(
            layers,
            selectedEntities.room,
            { owner: true, players: true },
          );
          setSelectedRoom(room);

          const exits = (room.exits)
            ? room.exits.map((exit) => getRoomByLocation(layers, exit * 1))
            : [];
          setSelectedExits(exits);
        }
      }, [selectedEntities.room, data.account]);


      ///////////////////
      // ACTIONS

      const move = (location: number) => {
        const room = getRoomByLocation(layers, location);
        const actionID = `Moving to ${room.name}` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.account.move(location * 1);
          },
        });
      };


      ///////////////////
      // DISPLAY

      return (
        <ModalWrapperFull
          id='world_map'
          divName='map'
          header={<MapGrid currentRoom={data.account.location * 1} move={move} />}
        >
          <RoomInfo room={selectedRoom} exits={selectedExits} move={move} />
        </ModalWrapperFull>
      );
    }
  );
}
