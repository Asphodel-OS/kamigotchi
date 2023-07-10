/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BigNumber, BigNumberish } from 'ethers';
import React, { useEffect, useState, useCallback } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
// import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { Kami, getKami } from 'layers/react/components/shapes/Kami';
import { Kill } from 'layers/react/components/shapes/Kill';
import { Trait, Traits } from 'layers/react/components/shapes/Trait';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import { EntityIndex } from '@latticexyz/recs';

export function registerKamiModal() {
  registerUIComponent(
    'KamiDetails',
    {
      colStart: 23,
      colEnd: 81,
      rowStart: 3,
      rowEnd: 99,
    },
    (layers) => {
      const {
        network: {
          components: {
            Balance,
            IsPet,
            IsKill,
            MediaURI,
            Name,
            PetID,
            SourceID,
            TargetID,
          },
        },
      } = layers;
      return merge(
        Balance.update$,
        IsPet.update$,
        IsKill.update$,
        MediaURI.update$,
        Name.update$,
        PetID.update$,
        SourceID.update$,
        TargetID.update$,
      ).pipe(
        map(() => {
          return {
            layers,
          };
        })
      );
    },

    ({ layers }) => {
      const [selectedKami, setSelectedKami] = useState<Kami>();
      const {
        selectedEntities,
        setSelectedEntities,
        visibleModals,
        setVisibleModals,
      } = dataStore();


      /////////////////
      // DATA FETCHING

      const hexToString = (num?: BigNumberish) => {
        return num ? BigNumber.from(num).toString() : '0';
      };

      useEffect(() => {
        if (selectedEntities.kami) {
          const kami = getKami(layers, selectedEntities.kami, { traits: true, kills: true, deaths: true });
          setSelectedKami(kami);
        }
      }, [selectedEntities.kami]);


      /////////////////
      // VISUAL COMPONENTS

      // Rendering of the Kami's Traits
      const TraitBox = (traits: Traits) => {
        const traitsArray = Object.entries(traits);
        return (
          <SectionContainer>
            <SectionTitle>Traits</SectionTitle>
            <SectionContent>
              {traitsArray.map((trait: [string, Trait]) => {
                const statArray = Object.entries(trait[1].stats);
                const statsText = statArray.map((stat: [string, number]) => `${stat[0]}: ${stat[1] * 1}`);

                return (
                  <Tooltip key={trait[0]} text={['STATS'].concat(statsText)} grow>
                    <InfoBox>
                      <InfoTitle>{trait[0].toUpperCase()}</InfoTitle>
                      <InfoContent>{trait[1].name}</InfoContent>
                    </InfoBox>
                  </Tooltip>
                );
              })}
            </SectionContent>
          </SectionContainer>
        );
      };

      const KDLogs = (kills: Kill[], deaths: Kill[]) => {
        const kdRatio = kills.length / Math.max(deaths.length, 1); // how to best compute this?
        const logs = kills.concat(deaths).sort((a, b) => b.time - a.time);
        const cellStyle = { fontFamily: 'Pixel', fontWeight: 12, border: 0 };

        return (
          <SectionContainer style={{ overflowY: 'scroll' }}>
            <SectionTitle>Kill/Death Logs</SectionTitle>
            <TableContainer >
              <Table>
                <TableHead>
                  {logs.map((log, index) => {
                    const type = log.source?.index === undefined ? 'kill' : 'death';
                    const subject = log.source?.index === undefined ? log.target : log.source;
                    const date = new Date(log.time * 1000);
                    const dateString = date.toLocaleString(
                      'default',
                      {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      }
                    );

                    return (
                      <TableRow key={index}>
                        <TableCell sx={cellStyle}>{dateString}</TableCell>
                        <TableCell sx={cellStyle}>{type}</TableCell>
                        <TableCell
                          sx={{ ...cellStyle, cursor: 'pointer' }}
                          onClick={() => setSelectedEntities({ ...selectedEntities, kami: subject?.entityIndex! })}
                        >
                          {subject?.name}
                        </TableCell>
                        <TableCell sx={cellStyle}>{log.node.name}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableHead>
              </Table>
            </TableContainer>
          </SectionContainer>
        );
      }

      const Affinities = () => {
        const strRaw = selectedKami?.affinities?.reduce((ac, x) => (ac = ac + ' | ' + x));
        const str = strRaw?.slice(0, -2);
        return <KamiText>{str}</KamiText>;
      };

      const hideModal = useCallback(() => {
        setVisibleModals({ ...visibleModals, kami: false });
      }, [setVisibleModals, visibleModals]);


      /////////////////
      // RENDERING

      return (
        <ModalWrapperFull zindex={true} divName='kami' id='kamiModal'>
          <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
            X
          </TopButton>
          <TopDiv>
            <KamiImage src={selectedKami?.uri} />
            <div
              style={{
                display: 'grid',
                gridRowGap: '5px',
                gridColumnGap: '5px',
              }}
            >
              <KamiName>{selectedKami?.name} </KamiName>
              <KamiText
                style={{ gridRow: 2, gridColumnStart: 1, gridColumnEnd: 5, margin: '10px' }}
              >
                {Affinities()}
              </KamiText>
              <StatBox key={'health'} style={{ gridRow: 3, gridColumn: 1 }}>
                <KamiText> Health </KamiText>
                <KamiFacts> {hexToString(selectedKami?.stats.health)} </KamiFacts>
              </StatBox>
              <StatBox key={'power'} style={{ gridRow: 3, gridColumn: 2 }}>
                <KamiText> Power </KamiText>
                <KamiFacts> {hexToString(selectedKami?.stats.power)} </KamiFacts>
              </StatBox>
              <StatBox key={'violence'} style={{ gridRow: 3, gridColumn: 3 }}>
                <KamiText> Violence </KamiText>
                <KamiFacts> {hexToString(selectedKami?.stats.violence)} </KamiFacts>
              </StatBox>
              <StatBox key={'harmony'} style={{ gridRow: 3, gridColumn: 4 }}>
                <KamiText> Harmony </KamiText>
                <KamiFacts> {hexToString(selectedKami?.stats.harmony)} </KamiFacts>
              </StatBox>
              <StatBox key={'slots'} style={{ gridRow: 3, gridColumn: 5 }}>
                <KamiText> Slots </KamiText>
                <KamiFacts> {hexToString(selectedKami?.stats.slots)} </KamiFacts>
              </StatBox>
            </div>
          </TopDiv>
          {selectedKami && TraitBox(selectedKami.traits!)}
          {selectedKami && KDLogs(selectedKami.kills!, selectedKami.deaths!)}
        </ModalWrapperFull>
      );
    }
  );
}

const SectionContainer = styled.div`
  border-width: 2px;
  border-color: black;
  border-style: solid;
  margin: 5px 0px 0px 0px;
  padding: 5px;

  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.div`
  background-color: #ffffff;
  margin: 15px;

  color: black;
  font-family: Pixel;
  font-size: 30px;
  font-weight: 600;
`;

const SectionContent = styled.div`
  display: flex;
  flex-direction: row wrap;
`;

const InfoBox = styled.div`
  border-style: solid;
  border-width: 2px;
  border-color: black;
  margin: 2px;
  flex-grow: 1;
  
  padding: 5px;
  display: flex;
  flex-direction: column;
`

const InfoTitle = styled.div`
  background-color: #ffffff;
  margin: 5px;
  align-self: flex-start;
  
  color: black;
  font-family: Pixel;
  font-size: 14px;
`;

const InfoContent = styled.div`
  background-color: #ffffff;
  color: black;
  padding: 5px;
  align-self: center;

  font-size: 20px;
  font-weight: 600;
  font-family: Pixel;
  margin: auto;
`;



const KamiText = styled.div`
  background-color: #ffffff;
  color: black;
  font-size: 14px;
  font-family: Pixel;
  grid-row: 1;
`;

const KamiFacts = styled.div`
  background-color: #ffffff;
  color: black;
  font-size: 20px;
  font-weight: 600;
  font-family: Pixel;
  margin: auto;
  grid-row: 2;
`;

const KamiName = styled.div`
  grid-row: 1;
  grid-column-start: 1;
  grid-column-end: 5;
  font-size: 36px;
  color: #333;
  font-weight: bold;
  padding: 10px;
  font-family: Pixel;
`;

const KamiImage = styled.img`
  height: 160px;
  width: 160px;
  margin: 0px;
  padding: 0px;
  grid-row: 1 / span 1;
  border-width: 0px 2px 0px 0px;
  border-color: black;
  border-style: solid;
`;

const TopDiv = styled.div`
  border-style: solid;
  border-width: 2px;
  border-color: black;
  display: flex;
  padding: 0px;
  margin: 0px;
  margin-top: 5px;
`;

const StatBox = styled.div`
  border-style: solid;
  border-width: 2px;
  border-color: black;
  padding: 5px;
  display: grid;
  margin: 2px;
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
