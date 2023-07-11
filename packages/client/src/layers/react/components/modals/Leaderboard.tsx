import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import { Has, HasValue, runQuery } from '@latticexyz/recs';
import styled from 'styled-components';

import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { ActionListButton } from 'layers/react/components/library/ActionListButton';
import { getAccount } from 'layers/react/components/shapes/Account';
import { Score, ScoresFilter, getScores } from 'layers/react/components/shapes/Score';
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
          network,
          components: {
            IsAccount,
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
          // get the account through the account entity of the controlling wallet
          const accountIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(OperatorAddress, {
                value: network.connectedAddress.get(),
              }),
            ])
          )[0];

          const account = getAccount(layers, accountIndex);

          return {
            layers,
            data: { account },
          };
        })
      );
    },

    ({ layers, data }) => {
      const { visibleModals, setVisibleModals } = dataStore();
      const [filter, setFilter] = useState<ScoresFilter>({ epoch: 0, type: 'COLLECT' });
      const [tableData, setTableData] = useState<Score[]>([]);
      const [lastRefresh, setLastRefresh] = useState(Date.now());
      // console.log('leaderboardM: tableData', tableData);

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

      const renderTableRows = () => {
        return tableData.map((row, index) => (
          <React.Fragment key={index}>
            <GridCell>{index + 1}</GridCell>
            <GridCell>{row.account.name}</GridCell>
            <GridCell isLast>{row.score}</GridCell>
          </React.Fragment>
        ));
      };


      const EpochFilter = () => {
        const text = (!!filter.epoch) ? `Epoch: ${filter.epoch * 1}` : 'Epoch';
        const epochs = Array.from(new Set(layers.network.components.Epoch.values.value.values()));
        const epochsSorted = epochs.sort((a, b) => b - a);
        const options = epochsSorted.map((epoch: number) => {
          return {
            text: (epoch * 1).toString(),
            onClick: () => setFilter({ ...filter, epoch }),
          };
        });

        return (
          <ActionListButton
            id={'epoch-filter'}
            text={text}
            options={options}
          />
        );
      }

      const TypeFilter = () => {
        const text = (!!filter.type) ? `Type: ${filter.type}` : 'Type';
        const types = ['FEED', 'COLLECT', 'LIQUIDATE'];
        const options = types.map((type) => {
          return {
            text: type,
            onClick: () => setFilter({ ...filter, type }),
          };
        });

        return (
          <ActionListButton
            id={'type-filter'}
            text={text}
            options={options}
          />
        );
      }

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
          <Header>Leaderboards</Header>
          <StyledDivFlex>
            {EpochFilter()}
            {TypeFilter()}
          </StyledDivFlex>
          <GridContainer>
            <GridCell isBold>rank</GridCell>
            <GridCell isBold>player</GridCell>
            <GridCell isLast isBold>score</GridCell>
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

const Header = styled.h1`
  font-family: Pixel;
  text-align: center;
  color: black;
  margin: 10px;
  padding-top: 10px; 
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


