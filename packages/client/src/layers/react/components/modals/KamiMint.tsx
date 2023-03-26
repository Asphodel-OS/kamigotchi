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
import { waitForActionCompletion } from '@latticexyz/std-client';

import mintSound from 'assets/sound/fx/tami_mint_vending_sound.mp3';
import { dataStore } from 'layers/react/store/createStore';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { ActionButton } from 'layers/react/components/library/ActionButton';

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
          api: { player },
          network: { connectedAddress },
          actions,
          world,
        },
      } = layers;

      const {
        visibleModals,
        setVisibleModals,
        sound: { volume },
      } = dataStore();

      /////////////////
      // ACTIONS

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

          dataStore.setState({ selectedKami: { description } });
          setVisibleModals({ ...visibleModals, kamiMint: !visibleModals.kamiMint });
          setVisibleModals({
            ...visibleModals,
            kami: !visibleModals.kami,
          });

          const mintFX = new Audio(mintSound);
          mintFX.volume = volume * .6;
          mintFX.play();
        } catch (e) {
          //
        }
      };

      return (
        <ModalWrapperFull divName="kamiMint" id='petmint_modal'>
          <CenterBox>
            <KamiImage src="https://kamigotchi.nyc3.digitaloceanspaces.com/placeholder.gif" />
            <Description>Kamigotchi?</Description>
          </CenterBox>
          <ActionButton id='button-mint' onClick={handleMinting} size='large'>
            Mint
          </ActionButton>
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
