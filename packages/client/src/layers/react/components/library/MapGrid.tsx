import React, { useState } from 'react';
import styled from 'styled-components';
import { location, road, coreSprites, water } from 'assets/map';

interface MapProps {
  highlightedRoom?: number;
  move: Function;
}

// 17 x 9
const GRID_MAP = [
  // #9
  [
    coreSprites.Sprite2,
    coreSprites.Sprite3,
    coreSprites.Sprite4,
    coreSprites.Sprite19,
    coreSprites.Sprite1,
    coreSprites.Sprite2,
    coreSprites.Sprite3,
    coreSprites.Sprite4,
    coreSprites.Sprite1,
    coreSprites.Sprite12,
    coreSprites.Sprite4,
    coreSprites.Sprite2,
    coreSprites.Sprite3,
    coreSprites.Sprite8,
    water.Sprite9,
    coreSprites.Sprite23,
    coreSprites.Sprite7,
  ],
  // #8
  [
    coreSprites.Sprite1,
    coreSprites.Sprite18,
    coreSprites.Sprite20,
    location.Sprite6,
    road.Sprite6,
    road.Sprite8,
    coreSprites.Sprite1,
    coreSprites.Sprite2,
    coreSprites.Sprite10,
    coreSprites.Sprite12,
    coreSprites.Sprite10,
    coreSprites.Sprite4,
    coreSprites.Sprite6,
    coreSprites.Sprite23,
    water.Sprite9,
    coreSprites.Sprite7,
    coreSprites.Sprite8,
  ],
  // #7
  [
    coreSprites.Sprite20,
    coreSprites.Sprite19,
    coreSprites.Sprite17,
    road.Sprite9,
    coreSprites.Sprite1,
    road.Sprite9,
    coreSprites.Sprite4,
    coreSprites.Sprite12,
    coreSprites.Sprite11,
    coreSprites.Sprite10,
    coreSprites.Sprite9,
    coreSprites.Sprite2,
    coreSprites.Sprite5,
    coreSprites.Sprite22,
    water.Sprite10,
    location.Sprite1,
    water.Sprite6,
  ],
  // #6
  [
    coreSprites.Sprite18,
    location.Sprite14,
    road.Sprite6,
    location.Sprite7,
    coreSprites.Sprite3,
    road.Sprite9,
    coreSprites.Sprite2,
    coreSprites.Sprite9,
    coreSprites.Sprite12,
    location.Sprite12,
    coreSprites.Sprite11,
    coreSprites.Sprite4,
    coreSprites.Sprite3,
    coreSprites.Sprite8,
    coreSprites.Sprite6,
    road.Sprite9,
    coreSprites.Sprite5,
  ],
  // #5
  [
    coreSprites.Sprite2,
    coreSprites.Sprite17,
    coreSprites.Sprite19,
    road.Sprite9,
    coreSprites.Sprite9,
    road.Sprite9,
    coreSprites.Sprite10,
    coreSprites.Sprite4,
    coreSprites.Sprite11,
    road.Sprite9,
    coreSprites.Sprite1,
    coreSprites.Sprite10,
    coreSprites.Sprite4,
    coreSprites.Sprite2,
    coreSprites.Sprite6,
    road.Sprite9,
    coreSprites.Sprite8,
  ],
  // #4
  [
    coreSprites.Sprite1,
    coreSprites.Sprite16,
    coreSprites.Sprite1,
    location.Sprite8,
    coreSprites.Sprite1,
    location.Sprite5,
    road.Sprite6,
    road.Sprite6,
    road.Sprite6,
    location.Sprite4,
    coreSprites.Sprite10,
    coreSprites.Sprite2,
    coreSprites.Sprite3,
    location.Sprite13,
    coreSprites.Sprite8,
    road.Sprite9,
    coreSprites.Sprite6,
  ],
  // #3
  [
    coreSprites.Sprite15,
    water.Sprite9,
    coreSprites.Sprite13,
    coreSprites.Sprite4,
    coreSprites.Sprite7,
    road.Sprite9,
    coreSprites.Sprite5,
    coreSprites.Sprite2,
    coreSprites.Sprite10,
    road.Sprite9,
    coreSprites.Sprite4,
    coreSprites.Sprite3,
    coreSprites.Sprite1,
    road.Sprite9,
    coreSprites.Sprite8,
    road.Sprite9,
    coreSprites.Sprite6,
  ],
  // #2
  [
    coreSprites.Sprite14,
    location.Sprite11,
    road.Sprite6,
    road.Sprite6,
    road.Sprite6,
    location.Sprite9,
    road.Sprite6,
    location.Sprite10,
    coreSprites.Sprite8,
    road.Sprite10,
    road.Sprite6,
    location.Sprite3,
    road.Sprite6,
    location.Sprite2,
    road.Sprite6,
    road.Sprite11,
    coreSprites.Sprite7,
  ],
  // #1
  [
    coreSprites.Sprite13,
    coreSprites.Sprite5,
    coreSprites.Sprite6,
    coreSprites.Sprite7,
    coreSprites.Sprite8,
    coreSprites.Sprite5,
    coreSprites.Sprite7,
    coreSprites.Sprite1,
    coreSprites.Sprite3,
    coreSprites.Sprite2,
    coreSprites.Sprite4,
    coreSprites.Sprite7,
    coreSprites.Sprite1,
    coreSprites.Sprite5,
    coreSprites.Sprite6,
    coreSprites.Sprite7,
    coreSprites.Sprite8,
  ],
];

const ROOMS_MAP = new Map([
  ['1,3', 6],
  ['3,1', 14],
  ['3,3', 7],
  ['3,9', 12],
  ['5,3', 8],
  ['5,5', 5],
  ['5,9', 4],
  ['2,15', 1],
  ['7,1', 11],
  ['7,5', 9],
  ['7,7', 10],
  ['7,11', 3],
  ['7,13', 2],
  ['5,13', 13],
]);

const Tile = ({ img, highlightedRoom, move, rowIndex, colIndex }: any) => {
  const room = ROOMS_MAP.get(`${rowIndex},${colIndex}`);
  const isHighlighted = room === highlightedRoom;
  const highlightStyle = isHighlighted ? { border: '1.5px solid red' } : {};
  const isClickable = !!room;
  const hoverStyle = isClickable ? { cursor: 'pointer' } : {};
  const [isHovered, setHovered] = useState(false);

  const handleMouseEnter = () => {
    if (isClickable) {
      setHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (isClickable) {
      setHovered(false);
    }
  };

  if (!img) {
    return <div style={{ width: '100%', height: '100%', backgroundColor: 'green' }} />;
  }

  return (
    <img
      src={img}
      alt=''
      onClick={isClickable ? () => move(room) : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: '100%',
        height: '100%',
        ...hoverStyle,
        ...(isHovered ? { border: '1px solid red' } : {}),
        ...highlightStyle,
      }}
    />
  );
};

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(17, 1fr);
  grid-template-rows: repeat(9, 1fr);
  background-color: green;
`;

const GridTile = styled.div`
  position: relative;
`;

const MapGrid = ({ highlightedRoom, move }: MapProps) => {
  return (
    <GridContainer>
      {GRID_MAP.map((row, rowIndex) => (
        <React.Fragment key={rowIndex}>
          {row.map((tile, colIndex) => (
            <GridTile key={colIndex}>
              <Tile
                img={tile}
                highlightedRoom={highlightedRoom}
                move={move}
                rowIndex={rowIndex}
                colIndex={colIndex}
              />
            </GridTile>
          ))}
        </React.Fragment>
      ))}
    </GridContainer>
  );
};

export default MapGrid;
