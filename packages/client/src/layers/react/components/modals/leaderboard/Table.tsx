import React from 'react';
import styled from 'styled-components';

import { Score } from "layers/react/shapes/Score"
import 'layers/react/styles/font.css';


interface Props {
  data: Score[];
};

// the table rendering of the leaderboard modal
export const Table = (props: Props) => {
  const Rows = () => {
    return props.data.map((row, index) => (
      <React.Fragment key={index}>
        <GridCell>{index + 1}</GridCell>
        <GridCell>{row.account.name}</GridCell>
        <GridCell isLast>{row.score}</GridCell>
      </React.Fragment>
    ));
  };

  return (
    <GridContainer>
      <GridCell isBold>rank</GridCell>
      <GridCell isBold>player</GridCell>
      <GridCell isLast isBold>score</GridCell>
      {Rows()}
    </GridContainer>
  );
}

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-row-gap: 5px;
  margin: 0 1vw
`;

interface GridCellProps {
  isLast?: boolean;
  isBold?: boolean;
}

const GridCell = styled.div<GridCellProps>`
  padding: 5px;
  font-family: Pixel;
  color: black;
  text-align: center;
  border-left: 1px solid #000;
  border-right: ${({ isLast }) => (isLast ? '1px solid #000' : 'none')};
  font-weight: ${({ isBold }) => (isBold ? 'bold' : 'normal')};
`;

