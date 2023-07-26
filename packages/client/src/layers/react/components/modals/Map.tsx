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
      const [selectedExits, setSelectedExits] = useState<Room[]>([]);

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
          const room = getRoomByLocation(
            layers,
            selectedEntities.room,
            { owner: true, players: true },
          );
          setSelectedRoom(room);

          const exits = room.exits?.map((exit) => getRoomByLocation(layers, exit * 1));
          setSelectedExits(exits);
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
        setCurrentLocation(location);
      };

      const RoomInfo = ({ room, exits }: { room: Room | undefined, exits: Room[] }) => {
        if (!room) return <div />;
        return (
          <Scrollable ref={scrollableRef}>
            <SectionContainer>
              <SectionTitle style={{ fontSize: 16 }}>Room {room.location}: {room.name}</SectionTitle>
              <Description>{room.owner ? (room.owner.name) : ''}</Description>
              <Description>{room.description}</Description>
            </SectionContainer>

            <SectionContainer>
              <SectionTitle>Exits</SectionTitle>
              {exits.map((exit) => {
                return (
                  <ClickableDescription onClick={() => move(exit.location)}>
                    {exit.name}
                  </ClickableDescription>
                );
              })}
            </SectionContainer>

            <SectionContainer>
              <SectionTitle>Players</SectionTitle>
              <Description>{room.players?.map((player) => (player.name)).join(', ')}</Description>
            </SectionContainer>
          </Scrollable>
        );
      };


      ///////////////////
      // DISPLAY

      const scrollableRef = useRef<HTMLDivElement>(null);

      return (
        <ModalWrapperFull id='world_map' divName='map'>
          <MapBox>
            <MapGrid currentRoom={currentLocation} move={move} />
          </MapBox>
          <RoomInfo room={selectedRoom} exits={selectedExits} />
        </ModalWrapperFull>
      );
    }
  );
}

const MapBox = styled.div`
  border-style: solid;
  border-width: 2px 2px 0px 2px;
  border-color: black;
  min-height: 50%;
  flex-grow: 1;
`;

const Scrollable = styled.div`
  overflow-y: scroll;
  height: 100%;
  max-height: 100%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  padding: 10px;
`;

const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin: 5px;
  padding: 10px;
`;

const SectionTitle = styled.p`
  font-size: 14px;
  color: #333;
  text-align: left;
  font-family: Pixel;
  padding: 5px 0px 10px 0px;
`;

const Description = styled.p`
  color: #333;
  padding: 5px;
  
  font-size: 12px;
  font-family: Pixel;
  text-align: left;
`;

// TODO: merge this with Description using props
const ClickableDescription = styled.p`
  color: #333;
  cursor: pointer;
  padding: 5px;
  
  font-size: 12px;
  font-family: Pixel;
  text-align: left;
  &:hover {
    opacity: 0.7;
  }
`;



