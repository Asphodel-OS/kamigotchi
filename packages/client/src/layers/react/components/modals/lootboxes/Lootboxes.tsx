import React, { useCallback, useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { registerUIComponent } from 'layers/react/engine/store';
import { EntityID, EntityIndex, Has, HasValue, runQuery } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { getAccountFromBurner } from 'layers/react/shapes/Account';

import { Opener } from './Opener';
import { Rewards } from './Rewards';
import { Lootbox, LootboxLog, getLootboxByIndex, getLootboxLog } from 'layers/react/shapes/Lootbox';
import { getItemByIndex } from 'layers/react/shapes/Item';



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
          world,
          network: { blockNumber$ }
        },
      } = layers;

      const [state, setState] = useState("OPEN");
      const [log, setLog] = useState<LootboxLog>();

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
      // UTILS

      const getLog = (index: EntityIndex) => {
        return getLootboxLog(layers, index);
      }

      const getLootbox = (index: number) => {
        return getLootboxByIndex(layers, index);
      }

      const getItem = (index: number) => {
        return getItemByIndex(layers, index);
      }

      ///////////////
      // DISPLAY

      const BackButton = () => {
        if (state === "OPEN") return (<div></div>);
        return (
          <ActionButton
            key='button-back'
            id='button-back'
            text='<'
            size='medium'
            onClick={() => setState("OPEN")}
          />
        );
      };

      const Header = () => {
        return (
          <Container>
            <div style={{ position: "absolute" }}>{BackButton()}</div>

            <SubHeader style={{ width: "100%" }}>Open Lootboxes</SubHeader>
          </Container>
        );
      };

      const SelectScreen = () => {
        switch (state) {
          case "OPEN":
            return (
              <Opener
                account={account}
                actions={{ openTx, revealTx, setState, setLog }}
                inventory={account.inventories?.lootboxes![0]!}
                utils={{ getLog, getLootbox }}
              />
            );
            break;
          case "REWARDS":
            return (
              <Rewards
                log={log!}
                utils={{ getItem }}
              />
            );
            break;
          default:
            return (
              <Opener
                account={account}
                actions={{ openTx, revealTx, setState, setLog }}
                inventory={account.inventories?.lootboxes![0]!}
                utils={{ getLog, getLootbox }}
              />
            );
            break;
        }
      }



      return (
        <ModalWrapperFull
          divName='lootboxes'
          id='LootboxesModal'
          header={Header()}
          overlay
        >
          {SelectScreen()}
        </ModalWrapperFull>
      );
    }
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding: .4vh 1.2vw;
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

const FullText = styled.div`
  color: #333;

  padding: 1.5vw;
  font-family: Pixel;
  font-size: 1vw;
  text-align: center;

  height: 100%;
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;
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
