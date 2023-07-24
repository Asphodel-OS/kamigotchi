import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import { map, merge } from 'rxjs';
import { EntityID, getComponentValue } from '@latticexyz/recs';
import styled from 'styled-components';

import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import MapGrid from 'layers/react/components/library/MapGrid';
import { registerUIComponent } from 'layers/react/engine/store';
import { Room, getRoomByLocation } from 'layers/react/shapes/Room';
import { dataStore } from 'layers/react/store/createStore';
import { useKamiAccount } from 'layers/react/store/kamiAccount';

export function registerMapModal() {
  registerUIComponent(
    'WorldMap',
    {
      colStart: 33,
      colEnd: 69,
      rowStart: 30,
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
          return {
            layers,
            actions,
            api: player,
          };
        })
      );
    },
    ({ layers, actions, api }) => {
      const { details: accountDetails } = useKamiAccount();
      const { selectedEntities, setSelectedEntities } = dataStore();
      const { visibleModals } = dataStore();
      const [currentLocation, setCurrentLocation] = useState<number>(1);
      const [selectedRoom, setSelectedRoom] = useState<Room>();


      /////////////////
      // DATA FETCHING

      // set selected room location to the player's current one when map modal is opened
      useEffect(() => {
        if (visibleModals.map) {
          const location = getComponentValue(
            layers.network.components.Location,
            accountDetails.index
          )?.value as number * 1;
          setCurrentLocation(location);
          setSelectedEntities({ ...selectedEntities, room: location });
        }
      }, [visibleModals.map]);

      // update the selected room details
      useEffect(() => {
        if (selectedEntities.room) {
          const room = getRoomByLocation(layers, selectedEntities.room);
          setSelectedRoom(room);
        }
      }, [selectedEntities.room]);


      ///////////////////
      // ACTIONS

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

      const RoomInfo = ({ room }: { room: Room | undefined }) => {
        if (!room) return <div />;
        return (
          <Scrollable ref={scrollableRef}>
            <RoomName>Room {room.location}: {room.name}</RoomName>
            <Description>{room.description}</Description>
            <Description>Room Owner: None</Description>
            <Description>
              Exits:{' '}
              {room.exits?.map((room) => (
                <StyledSpan>{room * 1}</StyledSpan>
              ))}
            </Description>
            <Description>
              You see [array of all operator names in room separated by commas] here
            </Description>
          </Scrollable>
        );
      };


      ///////////////////
      // DISPLAY

      const scrollableRef = useRef<HTMLDivElement>(null);

      return (
        <ModalWrapperFull id='world_map' divName='map'>
          <div style={{ display: 'grid', height: '100%' }}>
            <RoomInfo room={selectedRoom} />
            <MapBox>
              <MapGrid highlightedRoom={currentLocation} move={move} />
            </MapBox>
          </div>
        </ModalWrapperFull>
      );
    }
  );
}

const RoomName = styled.p`
  font-size: 16px;
  color: #333;
  text-align: left;
  font-family: Pixel;
  margin: 5px;
`;

const Description = styled.p`
  font-size: 12px;
  color: #333;
  text-align: left;
  font-family: Pixel;
  margin: 5px;
`;

const MapBox = styled.div`
  border-style: solid;
  border-width: 2px 2px 0px 2px;
  border-color: black;
  grid-column: 1;
  grid-row: 1;
`;

const Scrollable = styled.div`
  overflow-y: scroll;
  height: 100%;
  max-height: 100%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  grid-column: 1;
  grid-row: 2;
`;

const StyledSpan = styled.span`
  font-size: 12px;
  color: #333;
  font-family: Pixel;
  margin-left: 7px;
`;
