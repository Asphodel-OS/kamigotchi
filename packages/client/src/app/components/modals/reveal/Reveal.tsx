import { EntityID, EntityIndex } from '@mud-classic/recs';
import { registerUIComponent } from 'app/root';
import { waitForActionCompletion } from 'network/utils';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import { ActionButton, ModalHeader, ModalWrapper } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { settingsIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'network/shapes/Account';
import { queryDTCommits } from 'network/shapes/Droptable';
import { Commit, filterRevealable } from 'network/shapes/utils/commits';
import { useAccount, useWatchBlockNumber } from 'wagmi';
import { Commits } from './Commits';
import { Revealing } from './Revealing';

export function registerRevealModal() {
  registerUIComponent(
    'Reveal',
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
          const account = getAccountFromBurner(network);
          const commits = queryDTCommits(world, components, account.id);
          // const lootboxLog = getDTLogByHash(
          //   world,
          //   components,
          //   account.id,
          //   getItemByIndex(world, components, 10001)?.id!
          // );

          return {
            network: layers.network,
            data: { commits },
          };
        })
      ),

    // Render
    ({ network, data }) => {
      const { isConnected } = useAccount();
      const { commits } = data;
      const { actions, api, world } = network;

      const { modals } = useVisibility();
      const [tab, setTab] = useState('COMMITS');
      const [blockNumber, setBlockNumber] = useState(BigInt(0));

      /////////////////
      // SUBSCRIPTIONS

      useWatchBlockNumber({
        onBlockNumber: (n) => {
          setBlockNumber(n);
        },
      });

      // Refresh modal upon closure
      useEffect(() => {
        if (!modals.reveal) {
          setTab('COMMITS');
        }
      }, [modals.reveal]);

      /////////////////
      // ACTIONS

      useEffect(() => {
        const tx = async () => {
          if (!isConnected) return;

          const filtered = filterRevealable(commits, Number(blockNumber));
          if (filtered.length > 0) {
            try {
              // wait to give buffer for rpc
              // await new Promise((resolve) => setTimeout(resolve, 500));
              revealTx(filtered);
            } catch (e) {
              console.log('Lootbox.tsx: reveal failed', e);
            }
          }
        };

        tx();
      }, [commits]);

      const revealTx = async (commits: Commit[]) => {
        const ids = commits.map((commit) => commit.id);
        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'LootboxReveal',
          params: [ids],
          description: `Inspecting lootbox contents`,
          execute: async () => {
            return api.player.droptable.reveal(ids);
          },
        });
        await waitForActionCompletion(
          actions!.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );

        // wait to give buffer for rpc
        // await new Promise((resolve) => setTimeout(resolve, 500));
        setTab('REWARDS');
      };

      /////////////
      // DISPLAY

      const BackButton = () => {
        if (tab === 'COMMITS') return <div></div>;
        return (
          <BackWrapper>
            <ActionButton
              key='button-back'
              text='<'
              size='medium'
              onClick={() => setTab('COMMITS')}
            />
          </BackWrapper>
        );
      };

      const SelectScreen = () => {
        if (tab === 'REVEALING') {
          return <Revealing />;
          // } else if (tab === 'RESULTS') {
          //   return <Rewards account={account} log={lootboxLog} />;
        } else if (tab === 'COMMITS') {
          return (
            <Commits
              data={{ commits: commits, blockNumber: Number(blockNumber) }}
              actions={{ revealTx }}
            />
          );
        }
      };

      return (
        <ModalWrapper
          id='reveal'
          header={<ModalHeader title='Commits' icon={settingsIcon} />}
          overlay
          canExit
        >
          <Container>
            {BackButton()}
            {SelectScreen()}
          </Container>
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

  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;

  width: 100%;
`;

const BackWrapper = styled.div`
  position: absolute;
  top: 1vh;
  left: 1vw;
`;
