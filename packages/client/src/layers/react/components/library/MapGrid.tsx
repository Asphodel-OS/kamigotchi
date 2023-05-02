import React from 'react';
import styled from 'styled-components';

import {
  path_corner1,
  path_corner2,
  path_corner3,
  path_horiz,
  path_horiz_joint,
  path_vert,
  path_vert_joint,
  river_corner1,
  river_horiz,
  river_vert,
  tbuilding,
  tforest,
  tgate,
  tjunk,
  tmist,
  tmound,
  tmount,
  twaterfall,
  troom1,
  troom2,
  troom3,
  troom4,
  troom5,
  troom6,
  troom7,
  troom8,
  troom9,
  troom10,
  troom11,
  troom12,
  troom14,
  tshop,
} from '../../../../assets/map';

interface MapProps {
  highlightedRoom?: number;
  move: Function;
}

// 17 x 9
const GRID_MAP = [
  // #9
  [
    null,
    null,
    null,
    tbuilding,
    null,
    null,
    null,
    null,
    null,
    tjunk,
    null,
    null,
    null,
    tforest,
    river_vert,
    tmist,
    tforest,
  ],
  // #8
  [
    null,
    tbuilding,
    tbuilding,
    troom6,
    path_horiz,
    path_corner3,
    null,
    null,
    tjunk,
    tjunk,
    tjunk,
    null,
    tforest,
    tmist,
    river_vert,
    tforest,
    tforest,
  ],
  // #7
  [
    tbuilding,
    tbuilding,
    tbuilding,
    path_vert,
    null,
    path_vert,
    null,
    tjunk,
    tjunk,
    tjunk,
    tjunk,
    null,
    tforest,
    tmist,
    river_corner1,
    river_horiz,
    river_horiz,
  ],
  // #6
  [
    tbuilding,
    troom14,
    path_horiz,
    troom7,
    null,
    path_vert_joint,
    null,
    tjunk,
    tjunk,
    troom12,
    tjunk,
    null,
    null,
    tforest,
    tforest,
    troom1,
    tforest,
  ],
  // #5
  [
    null,
    tbuilding,
    tbuilding,
    path_vert,
    tjunk,
    path_vert,
    tjunk,
    null,
    tjunk,
    path_vert,
    null,
    tjunk,
    null,
    null,
    tforest,
    path_vert,
    tforest,
  ],
  // #4
  [
    null,
    tmount,
    null,
    troom8,
    null,
    troom5,
    path_horiz,
    path_horiz_joint,
    path_horiz,
    troom4,
    tjunk,
    null,
    null,
    tshop,
    tforest,
    path_vert_joint,
    tforest,
  ],
  // #3
  [
    tmount,
    river_vert,
    tmount,
    null,
    tforest,
    path_vert,
    tforest,
    null,
    tjunk,
    path_vert,
    null,
    null,
    tforest,
    path_vert,
    tforest,
    path_vert,
    tforest,
  ],
  // #2
  [
    tmount,
    twaterfall,
    tforest,
    troom11,
    path_horiz,
    troom9,
    path_horiz,
    troom10,
    tforest,
    path_corner1,
    path_horiz,
    troom3,
    path_horiz,
    troom2,
    path_horiz,
    path_corner2,
    tforest,
  ],
  // #1
  [
    tmount,
    tforest,
    tforest,
    tforest,
    tforest,
    tforest,
    tforest,
    tmound,
    null,
    tgate,
    null,
    tforest,
    null,
    tforest,
    tforest,
    tforest,
    tforest,
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
  ['3,15', 1],
  ['7,3', 11],
  ['7,5', 9],
  ['7,7', 10],
  ['7,11', 3],
  ['7,13', 2],
  ['5,13', 13],
]);

const Tile = ({ img, highlightedRoom, move, rowIndex, colIndex }) => {
  const room = ROOMS_MAP.get(`${rowIndex},${colIndex}`);
  const highlight = room === highlightedRoom ? { border: '1px solid red' } : {};

  if (!img) return <div style={{ width: '100%', height: '100%', backgroundColor: 'green' }} />;
  return (
    <img
      src={img}
      alt=''
      onClick={
        room
          ? () => {
              move(room);
            }
          : undefined
      }
      style={{ width: '100%', height: '100%', ...highlight }}
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
