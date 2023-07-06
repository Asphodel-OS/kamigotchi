/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BigNumber, BigNumberish } from 'ethers';
import React, { useEffect, useState, useCallback } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';

import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { Kami, getKami } from 'layers/react/components/shapes/Kami';
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
          components: { Balance, IsPet, MediaURI, Name, PetID },
        },
      } = layers;
      return merge(IsPet.update$, Balance.update$, PetID.update$, MediaURI.update$, Name.update$).pipe(
        map(() => {
          return {
            layers,
          };
        })
      );
    },

    ({ layers }) => {
      const {
        selectedEntities: { kami: kamiEntityIndex },
        visibleModals,
        setVisibleModals,
      } = dataStore();

      /////////////////
      // Get values

      const hexToString = (num?: BigNumberish) => {
        return num ? BigNumber.from(num).toString() : '0';
      };

      /////////////////
      // Display values

      const [selectedKami, setSelectedKami] = useState<Kami>();
      useEffect(() => {
        if (kamiEntityIndex) {
          const kami = getKami(layers, kamiEntityIndex, { traits: true });
          setSelectedKami(kami);
        }
      }, [kamiEntityIndex]);

      // Rendering of the Kami's Traits
      const TraitBox = (traits: Traits) => {
        const traitsArray = Object.entries(traits);
        return (
          <TraitContainer>
            <ContainerTitle>Traits</ContainerTitle>
            <ContainerContent>
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
            </ContainerContent>
          </TraitContainer>
        );
      };

      const Affinities = () => {
        const strRaw = selectedKami?.affinities?.reduce((ac, x) => (ac = ac + ' | ' + x));
        const str = strRaw?.slice(0, -2);
        return <KamiText>{str}</KamiText>;
      };

      const hideModal = useCallback(() => {
        setVisibleModals({ ...visibleModals, kami: false });
      }, [setVisibleModals, visibleModals]);

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
              <StatBox style={{ gridRow: 3, gridColumn: 1 }}>
                <KamiText> Health </KamiText>
                <KamiFacts> {hexToString(selectedKami?.stats.health)} </KamiFacts>
              </StatBox>
              <StatBox style={{ gridRow: 3, gridColumn: 2 }}>
                <KamiText> Power </KamiText>
                <KamiFacts> {hexToString(selectedKami?.stats.power)} </KamiFacts>
              </StatBox>
              <StatBox style={{ gridRow: 3, gridColumn: 3 }}>
                <KamiText> Violence </KamiText>
                <KamiFacts> {hexToString(selectedKami?.stats.violence)} </KamiFacts>
              </StatBox>
              <StatBox style={{ gridRow: 3, gridColumn: 4 }}>
                <KamiText> Harmony </KamiText>
                <KamiFacts> {hexToString(selectedKami?.stats.harmony)} </KamiFacts>
              </StatBox>
              <StatBox style={{ gridRow: 3, gridColumn: 5 }}>
                <KamiText> Slots </KamiText>
                <KamiFacts> {hexToString(selectedKami?.stats.slots)} </KamiFacts>
              </StatBox>
            </div>
          </TopDiv>
          {selectedKami && TraitBox(selectedKami.traits!)}
          <div
            style={{
              overflowY: 'scroll',
            }}
          >
          </div>
        </ModalWrapperFull>
      );
    }
  );
}

const TraitContainer = styled.div`
  border-width: 2px;
  border-color: black;
  border-style: solid;
  margin: 5px 0px 0px 0px;
  padding: 5px;

  display: flex;
  flex-direction: column;
`;

const ContainerTitle = styled.div`
  background-color: #ffffff;
  margin: 15px;

  color: black;
  font-family: Pixel;
  font-size: 30px;
  font-weight: 600;
  
`;

const ContainerContent = styled.div`
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
