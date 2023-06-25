import React, { useState } from 'react';
import { of } from 'rxjs';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import styled from 'styled-components';
import 'layers/react/styles/font.css';
import { ModalWrapperFull } from '../library/ModalWrapper';

export function registerLeaderboardModal() {
  registerUIComponent(
    'LeaderboardModal',
    {
      colStart: 28,
      colEnd: 74,
      rowStart: 20,
      rowEnd: 78,
    },
    (layers) => of(layers),
    () => {
      const data = [
        { rank: 1, score: 124, player: 'Mock 1' },
        { rank: 2, score: 117, player: 'Mock 2' },
        { rank: 3, score: 90, player: 'Mock 3' },
        { rank: 4, score: 84, player: 'Mock 4' },
        { rank: 5, score: 73, player: 'Mock 5' },
        { rank: 6, score: 59, player: 'Mock 6' },
      ];

      const renderTableRows = () => {
        return data.map((row, index) => (
          <React.Fragment key={index}>
            <GridCell>{row.rank}</GridCell>
            <GridCell>{row.score}</GridCell>
            <GridCell isLast>{row.player}</GridCell>
          </React.Fragment>
        ));
      };

      const { visibleModals, setVisibleModals } = dataStore();

      const hideModal = () => {
        setVisibleModals({ ...visibleModals, leaderboard: false });
      };

      return (
        <ModalWrapperFull divName='leaderboard' id='leaderboard'>
          <AlignRight>
            <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
              X
            </TopButton>
          </AlignRight>
          <StyledDiv>
            <TextHeader>Leaderboards</TextHeader>
          </StyledDiv>
          <StyledDivFlex>
            <StyledHeader>Epoch ▽</StyledHeader>
            <StyledHeader>Type ▽</StyledHeader>
          </StyledDivFlex>
          <GridContainer>
            <GridCell isBold>rank</GridCell>
            <GridCell isBold>score</GridCell>
            <GridCell isLast isBold>
              player
            </GridCell>
            {renderTableRows()}
          </GridContainer>
        </ModalWrapperFull>
      );
    }
  );
}

const AlignRight = styled.div`
  text-align: left;
  margin: 0px;
`;

const TopButton = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 5px;
  font-size: 14px;
  cursor: pointer;
  pointer-events: auto;
  border-radius: 5px;
  font-family: Pixel;
  width: 30px;
  &:active {
    background-color: #c4c4c4;
  }
  margin: 0px;
`;

const StyledDiv = styled.div`
  margin: 3% 0;
`;

const StyledHeader = styled.h3`
  padding-left: 2%;
  width: 33%;
  font-family: Pixel;
  cursor: pointer;
  color: black;
  text-align: center;
  &:before {
    content: '[';
  }
  &:after {
    content: ']';
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-row-gap: 5px;
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

const StyledDivFlex = styled.div`
  display: flex;
  margin: 2% 0;
  gap: 5px;
`;

const TextHeader = styled.h1`
  font-family: Pixel;
  text-align: center;
  color: black;
`;
