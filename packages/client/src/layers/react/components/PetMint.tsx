/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from 'react';
import { map, merge } from 'rxjs';
import { registerUIComponent } from '../engine/store';
import { dataStore } from '../store/createStore';
import styled from 'styled-components';
import {
  EntityID,
  EntityIndex,
  getComponentValue,
} from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';
import mintSound from '../../../public/sound/sound_effects/tami_mint_vending_sound.mp3';
import clickSound from '../../../public/sound/sound_effects/mouseclick.wav';
import { BigNumber, utils } from 'ethers';
import { ModalWrapper } from './styled/AnimModalWrapper';
import { useModalVisibility } from 'layers/react/hooks/useHandleModalVisibilty';

const SystemBalID = BigNumber.from(utils.id('system.ERC721.pet'));

export function registerPetMint() {
  registerUIComponent(
    'PetMint',
    {
      colStart: 33,
      colEnd: 65,
      rowStart: 37,
      rowEnd: 70,
    },
    (layers) => {
      const {
        network: {
          components: { IsPet, Balance },
          world,
        },
      } = layers;

      const getNextToken = () => {
        const id = world.entityToIndex.get(
          SystemBalID.toHexString() as EntityID
        );
        return getComponentValue(Balance, id as EntityIndex)?.value as number;
      };

      return merge(IsPet.update$, Balance.update$).pipe(
        map(() => {
          const nextToken = getNextToken();
          return {
            layers,
            nextToken,
          };
        })
      );
    },

    ({ layers, nextToken }) => {
      const {
        network: {
          components: { OwnerID, IsPet, Balance },
          api: { player },
          network: { connectedAddress },
          actions,
          world,
        },
      } = layers;

      const {
        visibleDivs,
        setVisibleDivs,
        setSelectedPet,
        selectedPet,
        sound: { volume },
      } = dataStore();

      const mintTx = (address: string) => {
        const actionID = `Minting Kami` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return player.ERC721.mint(address);
          },
        });
        return actionID;
      };
      const revealTx = (tokenID: string) => {
        const actionID = `Revealing Kami` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return player.ERC721.reveal(tokenID);
          },
        });
        return actionID;
      };

      const handleMinting = async () => {
        try {
          const mintFX = new Audio(mintSound);

          mintFX.volume = volume;
          mintFX.play();

          const mintActionID = mintTx(connectedAddress.get()!);
          await waitForActionCompletion(
            actions.Action,
            world.entityToIndex.get(mintActionID) as EntityIndex
          );
          const description = BigNumber.from(nextToken).add('1').toHexString();

          // revealing
          // might/should not be here, but putting for sake of testing
          const revealActionID = revealTx(description);
          await waitForActionCompletion(
            actions.Action,
            world.entityToIndex.get(revealActionID) as EntityIndex
          );

          dataStore.setState({ selectedPet: { description } });
          setVisibleDivs({ ...visibleDivs, petMint: !visibleDivs.petMint });
          setVisibleDivs({
            ...visibleDivs,
            petDetails: !visibleDivs.petDetails,
          });
        } catch (e) {
          //
        }
      };

      const { handleClick, visibleDiv } = useModalVisibility({
        soundUrl: clickSound,
        divName: 'petMint',
        elementId: 'petmint_modal',
      });

      return (
        <ModalWrapper id="petmint_modal" isOpen={visibleDiv}>
          <ModalContent>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                width: '100%',
              }}
            >
              <TopButton onClick={handleClick}>X</TopButton>
            </div>
            <CenterBox>
              <KamiImage src="https://kamigotchi.nyc3.digitaloceanspaces.com/placeholder.gif" />
              <Description>Kamigotchi?</Description>
            </CenterBox>
            <Button
              style={{
                gridRowEnd: 5,
                justifySelf: 'center',
                pointerEvents: 'auto',
              }}
              onClick={handleMinting}
            >
              Mint
            </Button>
          </ModalContent>
        </ModalWrapper>
      );
    }
  );
}

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px;
  padding: 8px;
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  justify-content: center;
  align-items: center;
`;

const CenterBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
`;

const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 18px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 5px;
  justify-content: center;
  font-family: Pixel;
`;

const Description = styled.p`
  font-size: 22px;
  color: #333;
  text-align: center;
  padding: 10px;
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
  grid-column: 5;
  width: 30px;
  &:active {
    background-color: #c2c2c2;
  }
  justify-self: right;
`;

const KamiImage = styled.img`
  border-style: solid;
  border-width: 0px;
  border-color: black;
  height: 90px;
  margin: 0px;
  padding: 0px;
`;
