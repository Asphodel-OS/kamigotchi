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
      colStart: 31,
      colEnd: 72,
      rowStart: 30,
      rowEnd: 80,
    },
    (layers) => {
      const {
        network: {
          components: { Balance, Genus, IsPet, IsTrait, MediaURI, PetID },
        },
      } = layers;

      return merge(
        IsPet.update$,
        IsTrait.update$,
        Balance.update$,
        PetID.update$,
        Genus.update$,
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
            Genus,
            Health,
            IsPet,
            IsTrait,
            MediaURI,
            Type,
            Affinity,
            Name,
            Harmony,
            PetIndex,
            PetID,
            Power,
            Slots,
            Violence,
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
          health: hexToString(getComponentValue(Health, index)?.value as number),
          power: hexToString(getComponentValue(Power, index)?.value as number),
          violence: '??',
          harmony: '??',
          slots: '??',
        };
      };

      const getBaseTraits = (petIndex: EntityIndex) => {
        const typeArr = ['COLOR', 'BODY', 'HAND', 'FACE', 'BACKGROUND'];
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

      const getTrait = (petIndex: EntityIndex, type: string) => {
        const entity = Array.from(
          runQuery([
            Has(Type),
            HasValue(Type, {
              value: type,
            }),
            HasValue(PetID, {
              value: world.entities[petIndex],
            }),
          ])
        )[0];

        return {
          Individual: {
            Name: getComponentValue(Name, entity)?.value as string,
            // Type: getComponentValue(Type, entity)?.value as string,
            // Value: getComponentValue(Value, entity)?.value as string,
          }
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
          <KamiList key={trait.Name}>
            {`${trait.Name}`}
            {/* <KamiText
              style={{ paddingTop: '20px' }}
            >{`${trait.Type} | {${trait.Value}}`}</KamiText> */}
          </KamiList>
        );
      });

      return (
        <ModalWrapperFull divName='kami' id='petdetails_modal'>
          <KamiBox>
            <KamiBox>
              <KamiBox style={{ gridColumn: 1, gridRow: 1 }}>
                <KamiName>{dets?.petName} </KamiName>
                <KamiImage src={dets?.uri} />
              </KamiBox>
              <KamiBox
                style={{ gridColumn: 1, gridRow: 2, justifyItems: 'end' }}
              >
                <KamiFacts>Affinity: {dets?.affinity} </KamiFacts>
                <KamiFacts>Health: {dets?.health} </KamiFacts>
                <KamiFacts>Power: {dets?.power} </KamiFacts>
                <KamiFacts>Violence: {dets?.violence} </KamiFacts>
                <KamiFacts>Harmony: {dets?.harmony}</KamiFacts>
                <KamiFacts>Slots: {dets?.slots} </KamiFacts>
              </KamiBox>
            </KamiBox>
            <KamiBox style={{ gridColumnStart: 2 }}>{traitLines}</KamiBox>
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
  margin: 4px 2px;
  padding: 0px 0px;
  border-radius: 5px;
  font-family: Pixel;

  display: grid;
  justify-items: center;
  justify-content: center;
  align-items: center;
  grid-row-gap: 8px;
  grid-column-gap: 24px;
`;

const KamiFacts = styled.div`
  background-color: #ffffff;
  color: black;
  font-size: 18px;
  font-family: Pixel;
  margin: 0px;
  padding: 10px;
`;

const KamiList = styled.li`
  background-color: #ffffff;
  color: black;
  font-size: 18px;
  font-family: Pixel;
  margin: 0px;

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
  font-size: 22px;
  color: #333;
  text-align: center;
  padding: 0px 0px 0px 0px;
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
  height: 90px;
  margin: 0px;
  padding: 0px;
  grid-row: 1 / span 1;
`;
