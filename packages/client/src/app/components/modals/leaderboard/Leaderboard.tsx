import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { Details, LeaderboardKey, leaderboardsDetails } from 'constants/leaderboards/leaderboards';
import { getAccountFromBurner } from 'network/shapes/Account';
import { Score, ScoresFilter, getScoresByFilter } from 'network/shapes/Score';

import { Filters } from './Filters';
import { Table } from './Table';

export function registerLeaderboardModal() {
  registerUIComponent(
    'LeaderboardModal',
    {
      colStart: 32,
      colEnd: 70,
      rowStart: 20,
      rowEnd: 78,
    },

    // Requirement
    (layers) => {
      return interval(3000).pipe(
        map(() => {
          const { network } = layers;
          const account = getAccountFromBurner(network);
          return {
            network,
            data: { account },
          };
        })
      );
    },

    // Render
    ({ network, data }) => {
      const { world, components } = network;
      const { modals } = useVisibility();
      const { leaderboardKey } = useSelected();
      const [filter, setFilter] = useState<ScoresFilter>({
        epoch: 1,
        type: 'TOTAL_SPENT',
      });
      const [tableData, setTableData] = useState<Score[]>([]);
      const [lbDetails, setLbDetails] = useState<Details>(leaderboardsDetails.default);

      // update details based on selected
      useEffect(() => {
        const dets = leaderboardsDetails[leaderboardKey as LeaderboardKey];
        setLbDetails(dets);
        setFilter({
          epoch: filter.epoch,
          type: dets ? dets.type : '',
        });
      }, [leaderboardKey]);

      // table data update
      useEffect(() => {
        if (modals.leaderboard) {
          const tableData = getScoresByFilter(world, components, filter);
          setTableData(tableData);
        }
      }, [filter, modals.leaderboard]);

      return (
        <ModalWrapper id='leaderboard' canExit overlay>
          <Header>{lbDetails ? lbDetails.title : 'Leaderboards'}</Header>
          <ColumnTitleBox>
            <ColumnTitleText style={{ flexBasis: '10%' }}>Rank</ColumnTitleText>
            <ColumnTitleText style={{ flexBasis: '70%' }}>Player</ColumnTitleText>
            <ColumnTitleText style={{ flexBasis: '20%' }}>
              {lbDetails ? lbDetails.scoreTitle : 'Score'}
            </ColumnTitleText>
          </ColumnTitleBox>
          <Table data={tableData} prefix={lbDetails ? lbDetails.scorePrefix ?? '' : ''} />
          {lbDetails && lbDetails.showFilter ? (
            <Filters filter={filter} setFilter={setFilter} epochOptions={[1]} />
          ) : (
            <div></div>
          )}
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

const ColumnTitleBox = styled.div`
  display: flex;
  flex-flow: row nowrap;
  margin: 0.75vh 1vw;
  border: solid black 0.15vw;
  border-radius: 0.75vw;
`;

const ColumnTitleText = styled.p`
  font-size: 1vw;
  font-family: Pixel;
  text-align: center;
  color: #333;

  padding: 1vh 1vw;
`;
