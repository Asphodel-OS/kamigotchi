import { EntityID } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useSelected, useVisibility } from 'app/stores';
import { Details, LeaderboardKey, LeaderboardsDetails } from 'constants/leaderboards/leaderboards';
import { getAccountByID, getAccountFromEmbedded } from 'network/shapes/Account';
import { Score, ScoresFilter, getScoresByFilter } from 'network/shapes/Score';
import { Filters } from './Filters';
import { Table } from './Table';

export const LeaderboardModal: UIComponent = {
  id: 'LeaderboardModal',
  requirement: (layers) => {
    return interval(3000).pipe(
      map(() => {
        const { network } = layers;
        const { world, components } = network;
        const account = getAccountFromEmbedded(network);

        return {
          network,
          data: { account },
          utils: {
            getAccountByID: (id: EntityID) => getAccountByID(world, components, id),
          },
        };
      })
    );
  },
  Render: ({ network, data, utils }) => {
      const { components } = network;
      const { modals } = useVisibility();
      const { leaderboardKey } = useSelected();
      const [filter, setFilter] = useState<ScoresFilter>({
        epoch: 1,
        index: 1,
        type: 'TOTAL_SPENT',
      });
      const [tableData, setTableData] = useState<Score[]>([]);
      const [details, setDetails] = useState<Details>(LeaderboardsDetails.default);

      // update details based on selected
      useEffect(() => {
        const dets = LeaderboardsDetails[leaderboardKey as LeaderboardKey];
        setDetails(dets);
        setFilter({
          ...filter,
          epoch: filter.epoch,
          index: filter.index,
          type: dets ? dets.type : '',
        });
      }, [leaderboardKey]);

      // table data update
      useEffect(() => {
        if (!modals.leaderboard) return;
        const tableData = getScoresByFilter(components, filter);
        setTableData(tableData);
      }, [filter, modals.leaderboard]);

      return (
        <ModalWrapper id='leaderboard' canExit overlay>
          <Header>{details ? details.title : 'Leaderboards'}</Header>
          <ColumnTitleBox>
            <ColumnTitleText style={{ flexBasis: '10%' }}>Rank</ColumnTitleText>
            <ColumnTitleText style={{ flexBasis: '70%' }}>Player</ColumnTitleText>
            <ColumnTitleText style={{ flexBasis: '20%' }}>
              {details ? details.label : 'Score'}
            </ColumnTitleText>
          </ColumnTitleBox>
          <Table scores={tableData} prefix={details ? details.prefix ?? '' : ''} utils={utils} />
          {details && details.showFilter ? (
            <Filters filter={filter} setFilter={setFilter} epochOptions={[1]} />
          ) : (
            <div></div>
          )}
        </ModalWrapper>
      );
  },
};

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
