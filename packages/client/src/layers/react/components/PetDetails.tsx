/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import { registerUIComponent } from '../engine/store';
import styled, { keyframes } from 'styled-components';
import {
  EntityIndex,
  EntityID,
  HasValue,
  Has,
  runQuery,
  getComponentValue,
} from '@latticexyz/recs';
import { dataStore } from '../store/createStore';
import clickSound from '../../../public/sound/sound_effects/mouseclick.wav';
import { BigNumber, BigNumberish } from 'ethers';
import { ModalWrapper } from './styled/AnimModalWrapper';
import { useModalVisibility } from 'layers/react/hooks/useHandleModalVisibilty';

type TraitDetails = {
  Name: string;
  // Type: string;
  // Value: string;
};

type Details = {
  nftID: string;
  petName: string;
  uri: string;
  // harmony: string;
  health: string;
  power: string;
  // slots: string;
  // violence: string;
  // affinity: string;
  traits: TraitDetails[];
};

export function registerPetDetails() {
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
        selectedPet: { description },
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
          // harmony: hexToString(getComponentValue(Harmony, index)?.value as number),
          health: hexToString(
            getComponentValue(Health, index)?.value as number
          ),
          power: hexToString(getComponentValue(Power, index)?.value as number),
          // slots: hexToString(getComponentValue(Slots, index)?.value as number),
          // violence: hexToString(getComponentValue(Violence, index)?.value as number),
          // affinity: hexToString(getComponentValue(Affinity, index)?.value as string),
          traits: traitsHopper?.value as TraitDetails[],
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

      const { handleClick, visibleDiv } = useModalVisibility({
        soundUrl: clickSound,
        divName: 'petDetails',
        elementId: 'petdetails_modal',
      });

      return (
        <ModalWrapper id="petdetails_modal" isOpen={visibleDiv}>
          <ModalContent>
            <TopButton onClick={handleClick}>X</TopButton>
            <KamiBox>
              <KamiBox>
                <KamiBox style={{ gridColumn: 1, gridRow: 1 }}>
                  <KamiName>{dets?.petName} </KamiName>
                  <KamiImage src={dets?.uri} />
                </KamiBox>
                <KamiBox
                  style={{ gridColumn: 1, gridRow: 2, justifyItems: 'end' }}
                >
                  <KamiFacts>Health: {dets?.health} </KamiFacts>
                  <KamiFacts>Harmony: {dets?.harmony}</KamiFacts>
                  <KamiFacts>Power: {dets?.power} </KamiFacts>
                  <KamiFacts>Slots: {dets?.slots} </KamiFacts>
                  <KamiFacts>Violence: {dets?.violence} </KamiFacts>
                  <KamiFacts>Affinity: {dets?.affinity} </KamiFacts>
                </KamiBox>
              </KamiBox>
              <KamiBox style={{ gridColumnStart: 2 }}>{traitLines}</KamiBox>
            </KamiBox>
          </ModalContent>
        </ModalWrapper>
      );
    }
  );
}

const ModalContent = styled.div`
  display: grid;
  background-color: white;
  border-radius: 10px;
  padding: 20px 20px 40px 20px;
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
`;

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

const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 5px;
  display: inline-block;
  font-size: 14px;
  cursor: pointer;
  border-radius: 5px;
  font-family: Pixel;

  &:active {
    background-color: #c2c2c2;
  }
`;

const Description = styled.p`
  font-size: 22px;
  color: #333;
  text-align: center;
  padding: 20px;
  font-family: Pixel;
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
    background-color: #c2c2c2;
  }
  justify-self: right;
`;
