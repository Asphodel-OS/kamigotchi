/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BigNumber, utils } from 'ethers';
import React from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { registerUIComponent } from 'layers/react/engine/store';
import {
  EntityID,
  EntityIndex,
  getComponentValue,
} from '@latticexyz/recs';
import { dataStore } from 'layers/react/store/createStore';
import { waitForActionCompletion } from '@latticexyz/std-client';
import mintSound from 'assets/sound/fx/tami_mint_vending_sound.mp3';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';

const SystemBalID = BigNumber.from(utils.id('system.ERC721.pet'));

export function registerKamiMintModal() {
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

      return (
        <ModalWrapperFull divName="petMint" elementId='petmint_modal'>
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
        </ModalWrapperFull>
      );
    }
  );
}

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

const KamiImage = styled.img`
  border-style: solid;
  border-width: 0px;
  border-color: black;
  height: 90px;
  margin: 0px;
  padding: 0px;
`;
