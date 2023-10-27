import React, { useCallback, useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { registerUIComponent } from 'layers/react/engine/store';
import { EntityID, EntityIndex, Has, HasValue, runQuery } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { getAccountFromBurner } from 'layers/react/shapes/Account';

import { Opener } from './Opener';
import { getLootboxByIndex } from 'layers/react/shapes/Lootbox';


export function registerLootboxesModal() {
  registerUIComponent(
    'Lootboxes',
    {
      colStart: 30,
      colEnd: 70,
      rowStart: 30,
      rowEnd: 75,
    },
    (layers) => {
      const {
        network: {
          network,
          components: {
            Balance,
            Balances,
            RevealBlock,
            HolderID,
          },
          systems,
        },
      } = layers;

      return merge(
        Balance.update$,
        Balances.update$,
        RevealBlock.update$,
        HolderID.update$,
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(
            layers,
            { lootboxLogs: true, inventory: true },
          );

          return {
            layers,
            account
          };
        })
      );
    },

    ({ layers, account }) => {
      const {
        network: {
          actions,
          api: { player },
          systems,
          world,
          network: { blockNumber$ }
        },
      } = layers;

      /////////////////
      // ACTIONS

      const openTx = async (index: number, amount: number) => {
        const actionID = (`Opening ${amount} lootbox${amount > 1 ? "es" : ""}`) as EntityID;
        actions?.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return player.lootbox.startReveal(index, amount);
          },
        });
        await waitForActionCompletion(
          actions!.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
        return;
      };

      const revealTx = async (id: EntityID) => {
        const actionID = (`Revealing...`) as EntityID;
        actions?.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return player.lootbox.executeReveal(id);
          },
        });
        await waitForActionCompletion(
          actions!.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
        return;
      };

      ///////////////
      // DISPLAY

      return (
        <ModalWrapperFull
          divName='lootboxes'
          id='LootboxesModal'
          overlay
          canExit
        >
          <Opener
            account={account}
            actions={{ openTx, revealTx }}
            lootbox={getLootboxByIndex(layers, 10001)}
            inventory={account.inventories?.lootboxes![0]!}
          />
        </ModalWrapperFull>
      );
    }
  );
}

const Grid = styled.div`
  display: grid;
  grid-row-gap: 6px;
  grid-column-gap: 12px;
  justify-items: center;
  justify-content: center;

  padding: 24px 6px;
  margin: 0px 6px;
`;

const Input = styled.input`
  width: 50%;

  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 12px;
  cursor: pointer;
  justify-content: center;
  font-family: Pixel;

  border-width: 0px;
  padding: 6px;

  &:focus {
    outline: none;
  }

  ::-webkit-inner-spin-button{
    -webkit-appearance: none; 
    margin: 0; 
  }
  ::-webkit-outer-spin-button{
    -webkit-appearance: none; 
    margin: 0; 
  }  
`;

const KamiImage = styled.img`
  border-style: solid;
  border-width: 0px;
  border-color: black;
  height: 90px;
  margin: 0px;
  padding: 0px;
`;

const ProductBox = styled.div`
  border-color: black;
  border-radius: 2px;
  border-style: solid;
  border-width: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 5px;
  max-width: 75%;
`;

const SubHeader = styled.p`
  color: #333;

  padding: 1.5vw;
  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;
`;

const SubText = styled.div`
  font-size: 12px;
  color: #000;
  text-align: center;
  padding: 4px 6px 0px 6px;
  font-family: Pixel;
`;

const QuantityStepper = styled.button`
  font-size: 16px;
  color: #777;
  text-align: center;
  font-family: Pixel;

  border-style: none;
  background-color: transparent;

  &:hover {
    color: #000;  
  }
`;
