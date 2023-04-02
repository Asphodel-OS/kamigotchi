import React from 'react';
import styled from 'styled-components';
import {
  room1,
  room2,
  room3,
  room4,
  room5,
  room6,
  room7,
  room8,
  room9,
  room10,
  room11,
  room12,
  room13,
  room14,
} from 'assets/images/rooms';

const MapContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
`;

interface LocationImageProps {
  highlight: boolean;
}

const LocationImage = styled.img<LocationImageProps>`
  position: relative;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  filter: ${(props) =>
    props.highlight ? 'drop-shadow(0px 0px 10px yellow)' : 'none'};
`;

interface RoomLocation {
  key: string;
  room: ReturnType<typeof room1>;
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
}

interface MapProps {
  highlightedRoom?: string;
}

const roomLocations: RoomLocation[] = [
  { key: 'room8', room: room8, position: { right: '50px', top: '30px' } },
  { key: 'room14', room: room14, position: { left: '50px', bottom: '5px' } },
  { key: 'room7', room: room7, position: { top: '10px' } },
  { key: 'room6', room: room6, position: { top: '30px' } },
  { key: 'room11', room: room11, position: { bottom: '5px', right: '70px' } },
  { key: 'room5', room: room5, position: { top: '15px' } },
  { key: 'room9', room: room9, position: { bottom: '20px', right: '70px' } },
  { key: 'room10', room: room10, position: { right: '70px' } },
  { key: 'room4', room: room4, position: { top: '20px' } },
  { key: 'room12', room: room12, position: { bottom: '15px', right: '70px' } },
  { key: 'room3', room: room3 },
  { key: 'room2', room: room2, position: { top: '20px' } },
  { key: 'room13', room: room13, position: { bottom: '15px', right: '70px' } },
  { key: 'room1', room: room1 },
];

export const Map: React.FC<MapProps> = ({ highlightedRoom }) => {
  return (
    <MapContainer>
      {roomLocations.map(({ key, room, position }) => (
        <div key={key}>
          <LocationImage
            style={position}
            highlight={highlightedRoom === key}
            src={room}
            alt={`Room ${room}`}
          />
        </div>
      ))}
    </MapContainer>
  );
};
