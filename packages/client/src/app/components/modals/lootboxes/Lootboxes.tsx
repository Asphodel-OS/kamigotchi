import { EntityID, EntityIndex } from '@mud-classic/recs';
import { registerUIComponent } from 'app/root';
import { waitForActionCompletion } from 'network/utils';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import { ActionButton, ModalWrapper } from 'app/components/library';
import { getAccountFromBurner } from 'network/shapes/Account';

import { useVisibility } from 'app/stores';
import { getItemByIndex } from 'network/shapes/Item';
import { getLootboxByIndex, getLootboxLog } from 'network/shapes/Lootbox';
import { Opener } from './Opener';
import { Revealing } from './Revealing';
import { Rewards } from './Rewards';

export function registerLootboxesModal() {
  registerUIComponent(
    'Lootboxes',
    {
      colStart: 30,
      colEnd: 70,
      rowStart: 30,
      rowEnd: 75,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const account = getAccountFromBurner(network, {
            lootboxLogs: true,
            inventory: true,
          });
          const selectedBox = getLootboxByIndex(world, components, 10001);

          return {
            network: layers.network,
            data: { account, selectedBox },
          };
        })
      ),

    // Render
    ({ network, data }) => {
      const { account, selectedBox } = data;
      const { actions, api, components, world } = network;

      const { modals } = useVisibility();
      const [state, setState] = useState('OPEN');
      const [amount, setAmount] = useState(0);
      const [waitingToReveal, setWaitingToReveal] = useState(false);

      // Refresh modal upon closure
      useEffect(() => {
        if (!modals.lootboxes) {
          setState('OPEN');
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
                setState('REWARDS');
              } catch (e) {
                console.log(e);
              }
            });
          }
        };
        tx();
      }, [account.lootboxLogs?.unrevealed, waitingToReveal]);

      // COMMIT REVEAL selected box
      useEffect(() => {
        const tx = async () => {
          if (!waitingToReveal && state === 'REVEALING') {
            try {
              setWaitingToReveal(true);
              await openTx(selectedBox?.index!, amount);
            } catch (e) {
              console.log(e);
            }
          }
        };
        tx();
      }, [waitingToReveal, amount, state]);

      const openTx = async (index: number, amount: number) => {
        const actionID = uuid() as EntityID;
        actions.add({
          action: 'LootboxCommit',
          params: [index, amount],
          description: `Opening ${amount} of lootbox ${index}`,
          execute: async () => {
            return api.player.lootbox.startReveal(index, amount);
          },
        });
        await waitForActionCompletion(
          actions!.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
        return;
      };

      const revealTx = async (id: EntityID) => {
        const actionID = uuid() as EntityID;
        actions.add({
          action: 'LootboxReveal',
          params: [id],
          description: `Inspecting lootbox contents`,
          execute: async () => {
            return api.player.lootbox.executeReveal(id);
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
        return getLootboxLog(world, components, index);
      };

      const getItem = (index: number) => {
        return getItemByIndex(world, components, index);
      };

      ///////////////
      // DISPLAY

      const BackButton = () => {
        if (state === 'OPEN') return <div></div>;
        return (
          <ActionButton key='button-back' text='<' size='medium' onClick={() => setState('OPEN')} />
        );
      };

      const Header = () => {
        return (
          <Container>
            <div style={{ position: 'absolute' }}>{BackButton()}</div>

            <SubHeader style={{ width: '100%' }}>Open Lootboxes</SubHeader>
          </Container>
        );
      };

      const SelectScreen = () => {
        switch (state) {
          case 'OPEN':
            return (
              <Opener
                inventory={account.inventories?.lootboxes[0]}
                lootbox={selectedBox}
                utils={{ setAmount, setState }}
              />
            );
            break;
          case 'REVEALING':
            return <Revealing />;
            break;
          case 'REWARDS':
            return <Rewards account={account} utils={{ getItem, getLog }} />;
            break;
          default:
            return (
              <Opener
                inventory={account.inventories?.lootboxes[0]}
                lootbox={selectedBox}
                utils={{ setAmount, setState }}
              />
            );
            break;
        }
      };

      return (
        <ModalWrapper id='lootboxes' header={Header()} overlay canExit>
          {SelectScreen()}
        </ModalWrapper>
      );
    }
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding: 0.4vh 1.2vw;
`;

const SubHeader = styled.p`
  color: #333;

  padding: 1.5vw;
  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;
`;
