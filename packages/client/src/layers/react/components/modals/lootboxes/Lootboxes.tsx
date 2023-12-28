import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { registerUIComponent } from 'layers/react/engine/store';
import { EntityID, EntityIndex } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';
import crypto from "crypto";

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { getAccountFromBurner } from 'layers/react/shapes/Account';

import { Opener } from './Opener';
import { Revealing } from './Revealing';
import { Rewards } from './Rewards';
import { getLootboxByIndex, getLootboxLog } from 'layers/react/shapes/Lootbox';
import { getItemByIndex } from 'layers/react/shapes/Item';
import { useVisibility } from 'layers/react/store/visibility';

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
          components: {
            AccountID,
            Balance,
            Balances,
            RevealBlock,
            HolderID,
            ItemIndex,
            MediaURI,
          },
        },
      } = layers;

      return merge(
        AccountID.update$,
        Balance.update$,
        Balances.update$,
        RevealBlock.update$,
        HolderID.update$,
        ItemIndex.update$,
        MediaURI.update$,
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(
            layers,
            { lootboxLogs: true, inventory: true },
          );

          return {
            layers,
            account,
            selectedBox: getLootboxByIndex(layers, 10001),
          };
        })
      );
    },

    ({ layers, account, selectedBox }) => {
      const {
        network: {
          actions,
          api: { player },
          world,
          network: { blockNumber$ }
        },
      } = layers;

      const { modals } = useVisibility();

      const [state, setState] = useState("OPEN");
      const [amount, setAmount] = useState(0);
      const [waitingToReveal, setWaitingToReveal] = useState(false);

      // Refresh modal upon closure
      useEffect(() => {
        if (!modals.lootboxes) {
          setState("OPEN");
        }
      }, [modals.lootboxes]);

      /////////////////
      // ACTIONS

      // (AUTO) REVEAL latest box
      useEffect(() => {
        const tx = async () => {
          if (waitingToReveal) {
            // wait to give buffer for OP rpc
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const raw = [...account.lootboxLogs?.unrevealed!];
            const reversed = raw.reverse();
            reversed.forEach(async (LootboxLog) => {
              try {
                await revealTx(LootboxLog.id);
                setWaitingToReveal(false);
                setState("REWARDS");
              }
              catch (e) { console.log(e); }
            });
          }
        }
        tx();
      }, [account.lootboxLogs?.unrevealed, waitingToReveal]);

      // COMMIT REVEAL selected box
      useEffect(() => {
        const tx = async () => {
          if (!waitingToReveal && state === "REVEALING") {
            try {
              setWaitingToReveal(true);
              await openTx(selectedBox?.index!, amount);
            }
            catch (e) { console.log(e); }
          }
        }
        tx();
      }, [waitingToReveal, amount, state]);

      const openTx = async (index: number, amount: number) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'LootboxCommit',
          params: [index, amount],
          description: `Opening ${amount} of lootbox ${index}`,
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
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'LootboxReveal',
          params: [id],
          description: `Inspecting lootbox contents`,
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
                inventory={account.inventories?.lootboxes![0]}
                lootbox={selectedBox}
                utils={{ setAmount, setState }}
              />
            );
            break;
          case "REVEALING":
            return (
              <Revealing />
            );
            break;
          case "REWARDS":
            return (
              <Rewards
                account={account}
                utils={{ getItem, getLog }}
              />
            );
            break;
          default:
            return (
              <Opener
                account={account}
                inventory={account.inventories?.lootboxes![0]}
                lootbox={selectedBox}
                utils={{ setAmount, setState }}
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
          overlay canExit
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

const SubHeader = styled.p`
  color: #333;

  padding: 1.5vw;
  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;
`;
