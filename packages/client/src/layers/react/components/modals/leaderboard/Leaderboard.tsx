import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import { Has, HasValue, runQuery } from '@latticexyz/recs';
import styled from 'styled-components';

import { Table } from './Table';
import { Filters } from './Filters';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { Score, ScoresFilter, getScores } from 'layers/react/shapes/Score';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import 'layers/react/styles/font.css';

export function registerLeaderboardModal() {
  registerUIComponent(
    'LeaderboardModal',
    {
      colStart: 28,
      colEnd: 74,
      rowStart: 20,
      rowEnd: 78,
    },
    // Requirement (Data Manangement)
    (layers) => {
      const {
        network: {
          components: {
            IsScore,
            Location,
            Name,
            OperatorAddress,
          },
        },
      } = layers;

      return merge(
        IsScore.update$,
        Location.update$,
        Name.update$,
        OperatorAddress.update$,
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(layers);
          return {
            layers,
            data: { account },
          };
        })
      );
    },

    ({ layers, data }) => {
      // console.log('leaderboardM: tableData', tableData);
      const { visibleModals } = dataStore();
      const [filter, setFilter] = useState<ScoresFilter>({ epoch: 0, type: 'COLLECT' });
      const [tableData, setTableData] = useState<Score[]>([]);
      const [lastRefresh, setLastRefresh] = useState(Date.now());

      // ticking
      useEffect(() => {
        const refreshClock = () => {
          setLastRefresh(Date.now());
        };
        const timerId = setInterval(refreshClock, 3000);
        return function cleanup() {
          clearInterval(timerId);
        };
      }, []);

      // table data update
      useEffect(() => {
        if (visibleModals.leaderboard) {
          const tableData = getScores(layers, filter);
          setTableData(tableData);
        }
      }, [filter, lastRefresh]);

      return (
        <ModalWrapperFull
          divName='leaderboard'
          id='leaderboard'
          canExit
          overlay
        >
          <Header>Leaderboards</Header>
          <Filters
            filter={filter}
            setFilter={setFilter}
            epochOptions={
              Array.from(
                new Set(layers.network.components.Epoch.values.value.values())
              )
            }
          />
          <Table data={tableData} />
        </ModalWrapperFull>
      );
    }
  );
}

const Header = styled.div`
  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;
  color: black;
  margin: 10px;
  padding-top: 1.5vw; 
`;
