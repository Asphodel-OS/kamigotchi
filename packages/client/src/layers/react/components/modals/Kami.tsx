/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import { registerUIComponent } from 'layers/react/engine/store';
import styled from 'styled-components';
import {
  EntityIndex,
  EntityID,
  HasValue,
  Has,
  runQuery,
  getComponentValue,
  Component,
} from '@latticexyz/recs';
import { dataStore } from 'layers/react/store/createStore';
import { BigNumber, BigNumberish } from 'ethers';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';

import { Kami, getKami } from 'layers/react/components/shapes/Kami';
import { Trait, getTrait } from 'layers/react/components/shapes/Trait';

export function registerKamiModal() {
  registerUIComponent(
    'KamiDetails',
    {
      colStart: 23,
      colEnd: 80,
      rowStart: 5,
      rowEnd: 85,
    },
    (layers) => {
      const {
        network: {
          components: { Balance, IsPet, MediaURI, PetID },
        },
      } = layers;

      return merge(
        IsPet.update$,
        Balance.update$,
        PetID.update$,
        MediaURI.update$
      ).pipe(
        map(() => {
          return {
            layers,
          };
        })
      );
    },

    ({ layers }) => {
      const {
        network: {
          components: {
            IsPet,
            PetIndex,
          },
        },
      } = layers;

      const {
        selectedKami: { description },
      } = dataStore();

      /////////////////
      // Get values
      const getPetIndex = (tokenID: string) => {
        return Array.from(
          runQuery([
            Has(IsPet),
            HasValue(PetIndex, {
              value: BigNumber.from(tokenID).toHexString(),
            }),
          ])
        )[0];
      };

      const hexToString = (num?: BigNumberish) => {
        return num ? BigNumber.from(num).toString() : "0";
      };

      /////////////////
      // Display values

      const [dets, setDets] = useState<Kami>();

      useEffect(() => {
        if (description && description != '0') {
          setDets(getKami(layers, getPetIndex(description), { traits: true }));
        }
      }, [description]);

      // const petTypes = (val: string[] | undefined) => {
      //   if (!val) return;
      //   let result = val[0];

      //   for (let i = 1; i < val.length; i++) {
      //     result = result + ' | ' + val[i];
      //   }
      //   return result;
      // };

      const traitBox = () => {
        return (
          <KamiBox style={{
            maxWidth: '50%',
          }}>
            <KamiText>BACKGROUND</KamiText>
            <KamiFacts>{dets?.background?.name}</KamiFacts>
            <KamiText>BODY</KamiText>
            <KamiFacts>{dets?.body?.name}</KamiFacts>
            <KamiText>COLOR</KamiText>
            <KamiFacts>{dets?.color?.name}</KamiFacts>
            <KamiText>FACE</KamiText>
            <KamiFacts>{dets?.face?.name}</KamiFacts>
            <KamiText>HAND</KamiText>
            <KamiFacts>{dets?.hand?.name}</KamiFacts>
          </KamiBox>
        )
      }

      const statsBox = () => {
        return (
          <KamiBox style={{
            maxWidth: '50%'
          }}>
            <KamiText>HEALTH</KamiText>
            <KamiFacts>{hexToString(dets?.stats.health)} </KamiFacts>
            <KamiText>POWER</KamiText>
            <KamiFacts>{hexToString(dets?.stats.power)} </KamiFacts>
            <KamiText>VIOLENCEL</KamiText>
            <KamiFacts>{hexToString(dets?.stats.violence)} </KamiFacts>
            <KamiText>HARMONY</KamiText>
            <KamiFacts>{hexToString(dets?.stats.harmony)}</KamiFacts>
            <KamiText>SLOTS</KamiText>
            <KamiFacts>{hexToString(dets?.stats.slots)} </KamiFacts>
          </KamiBox>
        )
      }

      const affinitiesBox = () => {
        const str = dets?.affinities?.reduce((ac, x) => ac = ac + ' | ' + x);
        return (
          <KamiText>
            {str}
          </KamiText>
        )
      }

      return (
        <ModalWrapperFull divName="kami" id="kamiModal">
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '15px',
            }}
          >
            {/* <KamiImage src={dets?.uri} /> */}
            <KamiImage src='https://kamigotchi.nyc3.cdn.digitaloceanspaces.com/tempKami.gif' />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <KamiName>{dets?.name} </KamiName>
              <KamiText>{affinitiesBox()}</KamiText>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              alignItems: 'center',
              padding: '10px',
            }}
          >
            {statsBox()}
            <Line> </Line>
            {traitBox()}
          </div>
        </ModalWrapperFull>
      );
    }
  );
}

const KamiBox = styled.div`
  background-color: #ffffff;
  border-style: solid;
  border-width: 0px;
  border-color: black;
  color: black;
  text-decoration: none;
  font-size: 18px;
  margin: 2px 1px;
  padding: 0px 0px;
  border-radius: 5px;
  font-family: Pixel;

  display: grid;
  justify-items: center;
  justify-content: center;
  align-items: center;
  grid-row-gap: 10px;
  grid-column-gap: 10px;
`;

const KamiFacts = styled.div`
  background-color: #ffffff;
  color: black;
  font-size: 25px;
  font-weight: 600;
  font-family: Pixel;
  margin: 0px;
  padding: 5px;
`;

const KamiText = styled.p`
  background-color: #ffffff;
  color: black;
  font-size: 12px;
  font-family: Pixel;
  margin: 0px;
  padding: 0px;
`;

const KamiName = styled.div`
  grid-row: 2;
  font-size: 36px;
  color: #333;
  text-align: center;
  font-weight: bold;
  padding: 0px 0px 20px 0px;
  font-family: Pixel;
`;

const KamiImage = styled.img`
  height: 300px;
  width: 300px;
  margin: 0px;
  padding: 10px;
  grid-row: 1 / span 1;
  border-width: 1px;
  border-color: black;
`;

const Line = styled.div`
  border-style: solid;
  border-width: 1px;
  border-color: black;
  color: black;
  height: 200px;
`
