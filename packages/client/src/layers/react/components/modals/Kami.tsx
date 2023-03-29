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

type TraitDetails = {
  Name: string;
  // Type: string;
  // Value: string;
};

type Details = {
  nftID: string;
  petName: string;
  uri: string;
  harmony: string;
  health: string;
  power: string;
  slots: string;
  violence: string;
  affinity: string;
  traits: TraitDetails[];
};

export function registerKamiModal() {
  registerUIComponent(
    'PetDetails',
    {
      colStart: 28,
      colEnd: 75,
      rowStart: 30,
      rowEnd: 80,
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
            Health,
            IsPet,
            MediaURI,
            Affinity,
            Name,
            Harmony,
            PetIndex,
            Power,
            Slots,
            Violence,
            BodyIndex,
            BackgroundIndex,
            ColorIndex,
            FaceIndex,
            HandIndex,
            TraitIndex,
          },
          world,
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

      const getDetails = (index: EntityIndex) => {
        const traitsHopper = getBaseTraits(index);
        return {
          nftID: getComponentValue(PetIndex, index)?.value as string,
          petName: getComponentValue(Name, index)?.value as string,
          uri: getComponentValue(MediaURI, index)?.value as string,
          traits: traitsHopper?.value as TraitDetails[],
          affinity: '??',
          health: hexToString(
            getComponentValue(Health, index)?.value as number
          ),
          power: hexToString(getComponentValue(Power, index)?.value as number),
          violence: hexToString(
            getComponentValue(Violence, index)?.value as number
          ),
          harmony: hexToString(
            getComponentValue(Harmony, index)?.value as number
          ),
          slots: hexToString(getComponentValue(Slots, index)?.value as number),
        };
      };

      const getBaseTraits = (petIndex: EntityIndex) => {
        const typeArr = [
          ColorIndex,
          BodyIndex,
          HandIndex,
          FaceIndex,
          BackgroundIndex,
        ];
        let result: Array<TraitDetails> = [];
        let petTypes: Array<string> = [];

        for (let i = 0; i < typeArr.length; i++) {
          let details = getTrait(petIndex, typeArr[i]);
          result.push(details.Individual);
        }

        return {
          value: result,
        };
      };

      const getTrait = (petIndex: EntityIndex, type: Component) => {
        const index = getComponentValue(type, petIndex)?.value as number;
        const entity = Array.from(
          runQuery([
            Has(TraitIndex),
            HasValue(type, {
              value: index,
            }),
          ])
        )[0];

        return {
          Individual: {
            Name: getComponentValue(Name, entity)?.value as string,
            // Type: getComponentValue(Type, entity)?.value as string,
            // Value: getComponentValue(Value, entity)?.value as string,
          },
        };
      };

      const hexToString = (num: BigNumberish) => {
        return BigNumber.from(num).toString();
      };

      /////////////////
      // Display values

      const [dets, setDets] = useState<Details>();

      useEffect(() => {
        if (description && description != '0') {
          setDets(getDetails(getPetIndex(description)));
        }
      }, [description]);

      const petTypes = (val: string[] | undefined) => {
        if (!val) return;
        let result = val[0];

        for (let i = 1; i < val.length; i++) {
          result = result + ' | ' + val[i];
        }
        return result;
      };

      const traitLines = dets?.traits.map((trait) => {
        return (
          <KamiList key={trait.Name}>{`${trait.Name.toUpperCase()}`}</KamiList>
        );
      });

      return (
        <ModalWrapperFull divName="kami" id="petdetails_modal">
          <KamiBox>
            <KamiBox>
              <KamiBox>
                <KamiImage src={dets?.uri} />
                <KamiBox
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {traitLines}
                </KamiBox>
              </KamiBox>
              <KamiBox
                style={{ gridColumn: 3, gridRowStart: 1, gridRowEnd: 3 }}
              >
                <KamiFacts>
                  <KamiName>{dets?.petName.toUpperCase()} </KamiName>
                </KamiFacts>
                <KamiFacts>AFFINITY: {dets?.affinity} </KamiFacts>
                <KamiFacts>HEALTH: {dets?.health} </KamiFacts>
                <KamiFacts>POWER: {dets?.power} </KamiFacts>
                <KamiFacts>VIOLENCE: {dets?.violence} </KamiFacts>
                <KamiFacts>HARMONY: {dets?.harmony}</KamiFacts>
                <KamiFacts>SLOTS: {dets?.slots} </KamiFacts>
              </KamiBox>
            </KamiBox>
          </KamiBox>
        </ModalWrapperFull>
      );
    }
  );
}

const KamiBox = styled.div`
  background-color: #ffffff;
  border-style: solid;
  border-width: 0px 0px 0px 0px;
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
  padding: 10px;
`;

const KamiList = styled.li`
  background-color: #ffffff;
  color: black;
  font-size: 16px;
  font-family: Pixel;
  margin: 0px;
  list-style-type: none;
  justify-self: start;
`;

const KamiText = styled.p`
  background-color: #ffffff;
  color: black;
  font-size: 12px;
  font-family: Pixel;
  margin: 0px;
  padding: 5px 10px;
`;

const KamiName = styled.div`
  grid-row: 2;
  font-size: 45px;
  color: #333;
  text-align: center;
  font-weight: bold;
  padding: 0px 0px 20px 0px;
  font-family: Pixel;
`;

const KamiType = styled.div`
  grid-row: 3;
  font-size: 12px;
  color: #333;
  text-align: center;
  padding: 0px 0px 20px 0px;
  font-family: Pixel;
`;

const KamiDetails = styled.div`
  grid-row: 3 / 6;
`;

const KamiImage = styled.img`
  height: 300px;
  width: 300px;
  margin: 0px;
  padding-bottom: 10px;
  grid-row: 1 / span 1;
`;
