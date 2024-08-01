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
import { getItemByIndex } from 'network/shapes/Item';
import { getLootboxLogByHash, queryLootboxCommits } from 'network/shapes/Lootbox';
import { Commit, filterRevealable } from 'network/shapes/utils/commits';
import { playClick } from 'utils/sounds';
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
            inventory: true,
          });
          const accLootboxes = (account.inventories || []).filter(
            (inv) => inv.item.type === 'LOOTBOX'
          );
          const commits = queryLootboxCommits(world, components, account.id);
          // only one lootbox for now
          const selectedBox = getItemByIndex(world, components, 10001);
          const lootboxLog = getLootboxLogByHash(
            world,
            components,
            account.id,
            selectedBox?.index!
          );

          return {
            network: layers.network,
            data: { account, accLootboxes, commits, lootboxLog, selectedBox },
          };
        })
      ),

    // Render
    ({ network, data }) => {
      const { isConnected } = useAccount();
      const { account, accLootboxes, commits, lootboxLog, selectedBox } = data;
      const { actions, api, world } = network;

      const { modals } = useVisibility();
      const [state, setState] = useState('OPEN');
      const [blockNumber, setBlockNumber] = useState(BigInt(0));
      const [triedReveal, setTriedReveal] = useState(true);
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
          if (!isConnected) return;

          const filtered = filterRevealable(commits, Number(blockNumber));
          if (!triedReveal && filtered.length > 0) {
            try {
              // wait to give buffer for rpc
              await new Promise((resolve) => setTimeout(resolve, 500));
              handleReveal(filtered);
              setTriedReveal(true);
            } catch (e) {
              console.log('Lootbox.tsx: reveal failed', e);
            }
            if (waitingToReveal) setWaitingToReveal(false);
          }
        };

        tx();
      }, [commits]);

      const openTx = async (index: number, amount: number) => {
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
        return actionID;
      };

      const revealTx = async (commits: Commit[]) => {
        const ids = commits.map((commit) => commit.id);
        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'LootboxReveal',
          params: [ids],
          description: `Inspecting lootbox contents`,
          execute: async () => {
            return api.player.lootbox.executeReveal(ids);
          },
        });
        await waitForActionCompletion(
          actions!.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
        return;
      };

      const handleOpen = async (index: number, amount: number) => {
        playClick();
        try {
          setState('REVEALING');
          await openTx(index, amount);

          setWaitingToReveal(true);
          setTriedReveal(false);
        } catch (e) {
          console.log('Lootbox.tsx: handleOpen() open failed', e);
        }
      };

      const handleReveal = async (commits: Commit[]) => {
        await revealTx(commits);

        // wait to give buffer for rpc
        await new Promise((resolve) => setTimeout(resolve, 500));
        setState('REWARDS');
      };

      /////////////
      // DISPLAY

      const BackButton = () => {
        if (state === 'OPEN') return <div></div>;
        return (
          <ActionButton key='button-back' text='<' size='medium' onClick={() => setState('OPEN')} />
        );
      };

      const ExpiredButton = () => {
        const hasExpired = commits.length > 0;
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
              actions={{ open: async (amount: number) => handleOpen(selectedBox?.index!, amount) }}
              data={{
                inventory: accLootboxes[0],
                lootbox: selectedBox,
              }}
            />
          );
        } else if (state === 'REVEALING') {
          return <Revealing />;
        } else if (state === 'REWARDS') {
          return <Rewards account={account} log={lootboxLog} />;
        } else if (state === 'COMMITS') {
          return (
            <Commits
              data={{ commits: commits, blockNumber: Number(blockNumber) }}
              actions={{ handleReveal }}
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
