import { EntityID, EntityIndex, getComponentValue } from '@mud-classic/recs';
import { UIComponent } from 'app/root/types';
import { useLayers } from 'app/root/hooks';
import { waitForActionCompletion } from 'network/utils';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { SettingsIcon } from 'assets/images/icons/menu';
import { getAccountFromEmbedded } from 'network/shapes/Account';
import { queryDTCommits } from 'network/shapes/Droptable';
import { useWatchBlockNumber } from 'wagmi';
import { Commits } from './Commits';

export const RevealModal: UIComponent = {
  id: 'RevealModal',
  Render: () => {
    const layers = useLayers();
    
    const {
      network,
      data: { commits }
    } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const account = getAccountFromEmbedded(network);
      const commits = queryDTCommits(world, components, account.id);

      return {
        network: layers.network,
        data: { commits },
      };
    })();

    const {
      actions,
      api,
      components: { State },
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
    }, [commits, blockNumber]);

    useEffect(() => {
      execute();
    }, [blockNumber]);

    /////////////////
    // REVEAL LOGIC

    async function execute() {
      const commits = DTRevealer.extractQueue();
      if (commits.length === 0) return;

      const actionIndex = await revealTx(commits);
      DTRevealer.finishReveal(actionIndex, commits);
    }

    async function overrideExecute(commits: EntityID[]) {
      if (commits.length === 0) return;

      DTRevealer.forceQueue(commits);
      const actionIndex = await revealTx(commits);
      DTRevealer.finishReveal(actionIndex, commits);
    }

    /////////////////
    // TRANSACTIONS

    const revealTx = async (commits: EntityID[]): Promise<EntityIndex> => {
      const actionIndex = actions.add({
        action: 'Droptable reveal',
        params: [commits],
        description: `Inspecting item contents`,
        execute: async () => {
          return api.player.droptable.reveal(commits);
        },
      });
      await waitForActionCompletion(actions.Action, actionIndex);
      return actionIndex;
    };

    /////////////////
    // UTILS

    const getCommitState = (id: EntityID): string => {
      const entity = world.entityToIndex.get(id);
      if (!entity) return 'EXPIRED';
      const state = getComponentValue(State, entity)?.value as string;
      return state ?? 'EXPIRED';
    };

    return (
      <ModalWrapper
        id='reveal'
        header={<ModalHeader title='Commits' icon={SettingsIcon} />}
        overlay
        canExit
      >
        <Container>
          <Commits
            data={{ commits: commits, blockNumber: Number(blockNumber) }}
            actions={{ revealTx: overrideExecute }}
            utils={{ getCommitState }}
          />
        </Container>
      </ModalWrapper>
    );
  },
};

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding: 0.4em 1.2em;
`;
