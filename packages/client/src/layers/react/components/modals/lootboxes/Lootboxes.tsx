import { EntityID, EntityIndex } from '@mud-classic/recs';
import { waitForActionCompletion } from 'layers/network/utils';
import { registerUIComponent } from 'layers/react/engine/store';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';

import { getItemByIndex } from 'layers/network/shapes/Item';
import { getLootboxByIndex, getLootboxLog } from 'layers/network/shapes/Lootbox';
import { useVisibility } from 'layers/react/store';
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
          const account = getAccountFromBurner(layers.network, {
            lootboxLogs: true,
            inventory: true,
          });
          const selectedBox = getLootboxByIndex(layers.network, 10001);

          return {
            network: layers.network,
            data: { account, selectedBox },
          };
        })
      ),

    // Render
    ({ network, data }) => {
      const { account, selectedBox } = data;
      const { actions, api, world } = network;

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
        actions?.add({
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
        actions?.add({
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
        return getLootboxLog(network, index);
      };

      const getItem = (index: number) => {
        return getItemByIndex(network, index);
      };

      ///////////////
      // DISPLAY

      const BackButton = () => {
        if (state === 'OPEN') return <div></div>;
        return (
          <ActionButton
            key='button-back'
            id='button-back'
            text='<'
            size='medium'
            onClick={() => setState('OPEN')}
          />
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
        <ModalWrapper divName='lootboxes' id='LootboxesModal' header={Header()} overlay canExit>
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
