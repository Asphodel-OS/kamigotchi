/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BigNumber, BigNumberish } from 'ethers';
import React, { useEffect, useState, useCallback } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';

import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Kami, getKami } from 'layers/react/components/shapes/Kami';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import { Traits } from '../shapes/Trait';

export function registerKamiModal() {
  registerUIComponent(
    'KamiDetails',
    {
      colStart: 23,
      colEnd: 80,
      rowStart: 5,
      rowEnd: 90,
    },
    (layers) => {
      const {
        network: {
          components: { Balance, IsPet, MediaURI, PetID },
        },
      } = layers;
      return merge(IsPet.update$, Balance.update$, PetID.update$, MediaURI.update$).pipe(
        map(() => {
          return {
            layers,
          };
        })
      );
    },

    ({ layers }) => {
      const {
        selectedEntities: { kami },
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

      const [dets, setDets] = useState<Kami>();
      useEffect(() => {
        if (kami) {
          setDets(getKami(layers, kami, { traits: true }));
        }
      }, [kami]);

      const traitBox = () => {
        return (
          <TraitBox>
            <KamiHeader style={{ gridRow: 1, gridColumn: 1 }}> Traits </KamiHeader>
            <StatBox style={{ gridRow: 2, gridColumn: 1 }}>
              <KamiText>BACKGROUND</KamiText>
              <KamiFacts>{dets?.traits?.background?.name}</KamiFacts>
            </StatBox>
            <StatBox style={{ gridRow: 2, gridColumn: 2 }}>
              <KamiText>BODY</KamiText>
              <KamiFacts>{dets?.traits?.body?.name}</KamiFacts>
            </StatBox>
            <StatBox style={{ gridRow: 2, gridColumn: 3 }}>
              <KamiText>COLOR</KamiText>
              <KamiFacts>{dets?.traits?.color?.name}</KamiFacts>
            </StatBox>
            <StatBox style={{ gridRow: 2, gridColumn: 4 }}>
              <KamiText>FACE</KamiText>
              <KamiFacts>{dets?.traits?.face?.name}</KamiFacts>
            </StatBox>
            <StatBox style={{ gridRow: 2, gridColumn: 5 }}>
              <KamiText>HAND</KamiText>
              <KamiFacts>{dets?.traits?.hand?.name}</KamiFacts>
            </StatBox>
          </TraitBox>
        );
      };

      const traitStats = (key: keyof Traits) => {
        if (dets?.traits) {
          const stats = dets.traits[key]?.stats;
          const statBoxes = [];
          let gridColumn = 1;

          if (stats && stats.health !== 0) {
            statBoxes.push(
              <StatBox style={{ gridRow: 2, gridColumn }}>
                <KamiText>Health</KamiText>
                <KamiFacts>{stats.health * 1}</KamiFacts>
              </StatBox>
            );
            gridColumn++;
          }

          if (stats && stats.harmony !== 0) {
            statBoxes.push(
              <StatBox style={{ gridRow: 2, gridColumn }}>
                <KamiText>Harmony</KamiText>
                <KamiFacts>{stats.harmony * 1}</KamiFacts>
              </StatBox>
            );
            gridColumn++;
          }

          if (stats && stats.power !== 0) {
            statBoxes.push(
              <StatBox style={{ gridRow: 2, gridColumn }}>
                <KamiText>Power</KamiText>
                <KamiFacts>{stats.power * 1}</KamiFacts>
              </StatBox>
            );
            gridColumn++;
          }

          if (stats && stats.slots !== 0) {
            statBoxes.push(
              <StatBox style={{ gridRow: 2, gridColumn }}>
                <KamiText>Slots</KamiText>
                <KamiFacts>{stats.slots * 1}</KamiFacts>
              </StatBox>
            );
            gridColumn++;
          }

          if (stats && stats.violence !== 0) {
            statBoxes.push(
              <StatBox style={{ gridRow: 2, gridColumn }}>
                <KamiText>Violence</KamiText>
                <KamiFacts>{stats.violence * 1}</KamiFacts>
              </StatBox>
            );
            gridColumn++;
          }

          return (
            <TraitBox style={{ gridTemplateColumns: `repeat(${gridColumn}, 1fr)` }}>
              <KamiHeader style={{ gridRow: 1, gridColumn: 1 }}>
                {dets.traits[key].affinity}
              </KamiHeader>
              {statBoxes}
            </TraitBox>
          );
        }

        return null;
      };

      const affinitiesBox = () => {
        const str = dets?.affinities?.reduce((ac, x) => (ac = ac + ' | ' + x));
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
            <KamiImage src={dets?.uri} />
            <div
              style={{
                display: 'grid',
                gridRowGap: '5px',
                gridColumnGap: '5px',
              }}
            >
              <KamiName>{dets?.name} </KamiName>
              <KamiText
                style={{ gridRow: 2, gridColumnStart: 1, gridColumnEnd: 5, margin: '10px' }}
              >
                {affinitiesBox()}
              </KamiText>
              <StatBox style={{ gridRow: 3, gridColumn: 1 }}>
                <KamiText> Health </KamiText>
                <KamiFacts> {hexToString(dets?.stats.health)} </KamiFacts>
              </StatBox>
              <StatBox style={{ gridRow: 3, gridColumn: 2 }}>
                <KamiText> Power </KamiText>
                <KamiFacts> {hexToString(dets?.stats.power)} </KamiFacts>
              </StatBox>
              <StatBox style={{ gridRow: 3, gridColumn: 3 }}>
                <KamiText> Violence </KamiText>
                <KamiFacts> {hexToString(dets?.stats.violence)} </KamiFacts>
              </StatBox>
              <StatBox style={{ gridRow: 3, gridColumn: 4 }}>
                <KamiText> Harmony </KamiText>
                <KamiFacts> {hexToString(dets?.stats.harmony)} </KamiFacts>
              </StatBox>
              <StatBox style={{ gridRow: 3, gridColumn: 5 }}>
                <KamiText> Slots </KamiText>
                <KamiFacts> {hexToString(dets?.stats.slots)} </KamiFacts>
              </StatBox>
            </div>
          </TopDiv>
          <div>{traitBox()}</div>
          <div>
            {Object.keys(dets?.traits ?? {}).map((key: any) => (
              <div key={key}>{traitStats(key)}</div>
            ))}
          </div>
        </ModalWrapperFull>
      );
    }
  );
}

const TraitBox = styled.div`
  display: grid;
  border-width: 2px;
  border-color: black;
  border-style: solid;
  margin: 5px 0px 0px 0px;
  padding: 5px;
  grid-row-gap: 5px;
`;

const KamiText = styled.p`
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

const TraitsHeader = styled.div`
  background-color: #ffffff;
  color: black;
  font-size: 15px;
  font-weight: 600;
  font-family: Pixel;
  margin: auto;
  margin: 5px;
`;

const KamiHeader = styled.div`
  background-color: #ffffff;
  color: black;
  font-size: 30px;
  font-weight: 600;
  font-family: Pixel;
  margin: auto;
  margin: 5px;
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

const Line = styled.div`
  border-style: solid;
  border-width: 1px;
  border-color: black;
  color: black;
  height: 200px;
`;

const TopDiv = styled.div`
  border-style: solid;
  border-width: 2px;
  border-color: black;
  display: flex;
  padding: 0px;
  margin: 0px;
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
