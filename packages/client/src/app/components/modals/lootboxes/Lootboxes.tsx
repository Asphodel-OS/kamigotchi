import { EntityID, EntityIndex } from '@mud-classic/recs';
import { registerUIComponent } from 'app/root';
import { waitForActionCompletion } from 'network/utils';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import { ActionButton, ModalWrapper } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { getAccountFromBurner } from 'network/shapes/Account';
import { getItemByIndex } from 'network/shapes/Item/Item';
import { getLootboxByIndex, getLootboxLog } from 'network/shapes/Item/Lootbox';
import { Commit, filterRevealable } from 'network/shapes/utils/commits';
import { useAccount, useWatchBlockNumber } from 'wagmi';
import { Commits } from './Commits';
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
          const accLootboxes = (account.inventories || []).filter(
            (inv) => inv.item.type === 'LOOTBOX'
          );
          const selectedBox = getLootboxByIndex(world, components, 10001);

          return {
            network: layers.network,
            data: { account, accLootboxes, selectedBox },
          };
        })
      ),

    // Render
    ({ network, data }) => {
      const { isConnected } = useAccount();
      const { account, accLootboxes, selectedBox } = data;
      const { actions, api, components, world } = network;

      const { modals } = useVisibility();
      const [state, setState] = useState('OPEN');
      const [blockNumber, setBlockNumber] = useState(BigInt(0));
      const [waitingToReveal, setWaitingToReveal] = useState(false);

      /////////////////
      // SUBSCRIPTIONS
      useWatchBlockNumber({
        onBlockNumber: (n) => {
          setBlockNumber(n);
        },
      });

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
            if (!isConnected) return;

            // wait to give buffer for OP rpc
            await new Promise((resolve) => setTimeout(resolve, 500));
            const raw = [...account.lootboxLogs?.unrevealed!];
            const reversed = filterRevealable(raw.reverse(), Number(blockNumber));

            reversed.forEach(async (LootboxLog) => {
              try {
                setWaitingToReveal(false);
                await revealTx(LootboxLog);
                setState('REWARDS');
              } catch (e) {
                console.log(e);
              }
            });
          }
        };

        tx();
      }, [account.lootboxLogs?.unrevealed, waitingToReveal]);

      const openTx = async (index: number, amount: number) => {
        setState('REVEALING');

        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
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
        setWaitingToReveal(true);
        return;
      };

      const revealTx = async (commit: Commit) => {
        const id = commit.id;
        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
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

      const ExpiredButton = () => {
        const hasExpired = account.lootboxLogs?.unrevealed
          ? account.lootboxLogs.unrevealed.length > 0
          : true;
        if (state !== 'OPEN' || !hasExpired) return <div></div>;

        return (
          <ExpiredWrapper>
            <ActionButton
              text='Expired commits'
              size='medium'
              onClick={() => setState('COMMITS')}
            />
          </ExpiredWrapper>
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
        if (state === 'OPEN') {
          return (
            <Opener
              actions={{ open: async (amount: number) => openTx(selectedBox?.index!, amount) }}
              data={{
                inventory: accLootboxes[0],
                lootbox: selectedBox,
              }}
            />
          );
        } else if (state === 'REVEALING') {
          return <Revealing />;
        } else if (state === 'REWARDS') {
          return <Rewards account={account} utils={{ getItem, getLog }} />;
        } else if (state === 'COMMITS') {
          return (
            <Commits
              data={{ commits: account.lootboxLogs?.unrevealed!, blockNumber: Number(blockNumber) }}
              actions={{ revealTx }}
            />
          );
        }
      };

      return (
        <ModalWrapper id='lootboxes' header={Header()} overlay canExit>
          {SelectScreen()}
          {ExpiredButton()}
        </ModalWrapper>
      );
    }
  );
}

const Container = styled.div`
  position: relative;
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

const ExpiredWrapper = styled.div`
  position: absolute;
  bottom: 1vh;
  right: 1vw;
`;
