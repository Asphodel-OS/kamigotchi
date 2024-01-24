import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';

import { Table } from './Table';
import { Filters } from './Filters';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { Score, ScoresFilter, getScores } from 'layers/network/shapes/Score';
import { registerUIComponent } from 'layers/react/engine/store';
import { useVisibility } from 'layers/react/store/visibility';
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
      const { network } = layers;
      const {
        IsScore,
        Location,
        Name,
        OperatorAddress,
      } = network.components;

      return merge(
        IsScore.update$,
        Location.update$,
        Name.update$,
        OperatorAddress.update$,
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(network);
          return {
            network,
            data: { account },
          };
        })
      );
    },

    ({ network, data }) => {
      // console.log('leaderboardM: tableData', tableData);
      const { modals } = useVisibility();
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
        if (modals.leaderboard) {
          const tableData = getScores(network, filter);
          setTableData(tableData);
        }
      }, [filter, lastRefresh]);

      return (
        <ModalWrapper
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
                new Set(network.components.Epoch.values.value.values())
              )
            }
          />
          <Table data={tableData} />
        </ModalWrapper>
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
