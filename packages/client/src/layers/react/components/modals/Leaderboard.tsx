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
      colStart: 38,
      colEnd: 64,
      rowStart: 20,
      rowEnd: 78,
    },
    (layers) => of(layers),
    () => {
      const [data] = useState([
        { rank: 1, score: 124, player: 'Mock 1' },
        { rank: 2, score: 117, player: 'Mock 2' },
        { rank: 3, score: 90, player: 'Mock 3' },
        { rank: 4, score: 84, player: 'Mock 4' },
        { rank: 5, score: 73, player: 'Mock 5' },
        { rank: 6, score: 59, player: 'Mock 6' },
      ]);

      const renderTableRows = () => {
        return data.map((row) => (
          <tr key={row.rank}>
            <BorderedTd>{row.rank}</BorderedTd>
            <BorderedTd>{row.score}</BorderedTd>
            <BorderedTd>{row.player}</BorderedTd>
          </tr>
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
          <Table>
            <thead>
              <tr>
                <th colSpan={2}>
                  <TableHeader>Leaderboards</TableHeader>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={2}>
                  <table>
                    <tbody>
                      <tr>
                        <BorderedTd>Epoch ▽</BorderedTd>
                        <BorderedTd>Type ▽</BorderedTd>
                      </tr>
                      <tr>
                        <BorderedTh>rank</BorderedTh>
                        <BorderedTh>score</BorderedTh>
                        <BorderedTh>player</BorderedTh>
                      </tr>
                      {renderTableRows()}
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </Table>
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

const Table = styled.table`
  margin-top: 10px;
  width: 100%;

  th {
    cursor: pointer;
  }

  td {
    width: 30%;
  }

  td,
  th {
    padding: 5px;
    font-family: Pixel;
    text-align: center;
  }

  tr:first-child th {
    border-top: none;
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

const BorderedTd = styled.td`
  border-left: 1px solid #000;
  border-right: 1px solid #000;
`;

const BorderedTh = styled.th`
  border-left: 1px solid #000;
  border-right: 1px solid #000;
`;

const TableHeader = styled.h1`
  font-family: Pixel;
`;
