/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useState, useCallback } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import Table from '@mui/material/Table';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { Kami, getKami } from 'layers/react/components/shapes/Kami';
import { Kill } from 'layers/react/components/shapes/Kill';
import { Trait, Traits } from 'layers/react/components/shapes/Trait';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';

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

      useEffect(() => {
        if (selectedEntities.kami) {
          const kami = getKami(layers, selectedEntities.kami, {
            account: true,
            deaths: true,
            kills: true,
            traits: true,
          });
          setSelectedKami(kami);
        }
      }, [selectedEntities.kami]);


      /////////////////
      // VISUAL COMPONENTS

      // Rendering of Kami overview details (name, affinity, stats)
      const OverviewSection = (kami: Kami) => {
        const statsArray = Object.entries(kami.stats);
        const affinities = kami.affinities?.join(' | ');
        const statsDescriptions = new Map(Object.entries({
          'health': 'defines how resilient a Kami is to accumulated damage',
          'power': 'determines the potential rate at which $KAMI can be farmed',
          'violence': 'dictates the threshold at which a Kami can liquidate others',
          'harmony': 'divines resting recovery rate and defends against violence',
          'slots': 'room for upgrades ^_^',
        }));

        return (
          <SectionContainer style={{ display: 'flex', flexDirection: 'row', padding: '0px' }}>
            <ContainerImage src={kami.uri} />
            <SectionContainer style={{ borderWidth: '0px', margin: '0px' }}>
              <SectionTitle>{kami.name}</SectionTitle>
              <SectionSubtitle>{affinities}</SectionSubtitle>
              <SectionContent>
                {statsArray.map((stat: [string, number]) => {
                  return (
                    <Tooltip key={stat[0]} text={[statsDescriptions.get(stat[0]) as string]} grow>
                      <InfoBox>
                        <InfoTitle>{stat[0].toUpperCase()}</InfoTitle>
                        <InfoContent>{stat[1] * 1}</InfoContent>
                      </InfoBox>
                    </Tooltip>
                  );
                })}
              </SectionContent>
            </SectionContainer>
            <ContainerInfo>
              <ContainerInfoText>{kami.account?.name}</ContainerInfoText>
            </ContainerInfo>
          </SectionContainer>
        );
      }

      // Rendering of the Kami's Traits
      const TraitSection = (traits: Traits) => {
        const traitsArray = Object.entries(traits);
        return (
          <SectionContainer>
            <SectionTitle>Traits</SectionTitle>
            <SectionContent>
              {traitsArray.map((trait: [string, Trait]) => {
                const statArray = Object.entries(trait[1].stats).filter((stat: [string, number]) => stat[1] > 0);
                const statsText = statArray.map(
                  (stat: [string, number]) => {
                    const name = stat[0].charAt(0).toUpperCase() + stat[0].slice(1);
                    const value = stat[1] * 1;
                    return `${name}: ${value}`;
                  }
                );

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


      const KDLogsSection = (kills: Kill[], deaths: Kill[]) => {
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


      /////////////////
      // RENDERING

      const hideModal = useCallback(() => {
        setVisibleModals({ ...visibleModals, kami: false });
      }, [setVisibleModals, visibleModals]);

      return (
        <ModalWrapperFull zindex={true} divName='kami' id='kamiModal'>
          <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
            X
          </TopButton>
          {selectedKami && OverviewSection(selectedKami)}
          {selectedKami && TraitSection(selectedKami.traits!)}
          {selectedKami && KDLogsSection(selectedKami.kills!, selectedKami.deaths!)}
        </ModalWrapperFull>
      );
    }
  );
}

const SectionContainer = styled.div`
  border-width: 2px;
  border-color: black;
  border-style: solid;
  border-radius: 7px;
  margin: 10px;

  padding: 10px;
  display: flex;
  flex-direction: column;
`;

const ContainerImage = styled.img`
  border-width: 0px 2px 0px 0px;
  border-color: black;
  border-style: solid;
  border-radius: 5px 0px 0px 5px;
  height: 100%;
`;

const ContainerInfo = styled.div`
  flex-grow: 1;

  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-end;
`;

const ContainerInfoText = styled.div`
  color: #333;
  font-size: 14px;
  font-family: Pixel;
  margin: 5px;
`;

const SectionTitle = styled.div`
  background-color: #ffffff;
  margin: 15px 5px;

  color: black;
  font-family: Pixel;
  font-size: 30px;
  font-weight: 600;
`;

const SectionSubtitle = styled.div`
  margin: 0px 0px 17px 10px;
  
  color: #666;
  font-size: 14px;
  font-family: Pixel;
`;

const SectionContent = styled.div`
  display: flex;
  flex-direction: row wrap;
`;

const InfoBox = styled.div`
  border-style: solid;
  border-width: 2px;
  border-color: black;
  border-radius: 5px;
  margin: 5px;
  
  padding: 5px;
  display: flex;
  flex-grow: 1;
  flex-direction: column;
`

const InfoTitle = styled.div`
  margin: 5px;
  align-self: flex-start;
  
  color: black;
  font-family: Pixel;
  font-size: 14px;
`;

const InfoContent = styled.div`
  color: black;
  padding: 5px;
  align-self: center;

  font-size: 20px;
  font-weight: 600;
  font-family: Pixel;
  margin: auto;
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
