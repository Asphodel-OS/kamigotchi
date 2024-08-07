import { EntityID, EntityIndex } from '@mud-classic/recs';
import { registerUIComponent } from 'app/root';
import { waitForActionCompletion } from 'network/utils';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { settingsIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'network/shapes/Account';
import { queryDTCommits } from 'network/shapes/Droptable';
import { Commit } from 'network/shapes/utils/commits';
import { useWatchBlockNumber } from 'wagmi';
import { Commits } from './Commits';

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

          return {
            network: layers.network,
            data: { commits },
          };
        })
      ),

    // Render
    ({ network, data }) => {
      const { commits } = data;
      const {
        actions,
        api,
        world,
        localSystems: { DTRevealer },
      } = network;

      const [blockNumber, setBlockNumber] = useState(BigInt(0));

      useWatchBlockNumber({
        onBlockNumber: (n) => {
          setBlockNumber(n);
        },
      });

      useEffect(() => {
        commits.map((commit) => DTRevealer.add(commit));
        DTRevealer.execute();
      }, [commits, blockNumber]);

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
      };

      return (
        <ModalWrapper
          id='reveal'
          header={<ModalHeader title='Commits' icon={settingsIcon} />}
          overlay
          canExit
        >
          <Container>
            <Commits
              data={{ commits: commits, blockNumber: Number(blockNumber) }}
              actions={{ revealTx }}
            />
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
