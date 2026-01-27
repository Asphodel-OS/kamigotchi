import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { EntityID, EntityIndex, getComponentValue } from 'engine/recs';
import { waitForActionCompletion } from 'network/utils';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { SettingsIcon } from 'assets/images/icons/menu';
import { getAccountFromEmbedded } from 'network/shapes/Account';
import { queryDTCommits, querySacrificeCommits } from 'network/shapes/Droptable';
import { useWatchBlockNumber } from 'wagmi';
import { Commits } from './Commits';

export const RevealModal: UIComponent = {
  id: 'RevealModal',
  Render: () => {
    const layers = useLayers();

    const {
      network,
      data: { commits, sacrificeCommits },
    } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const account = getAccountFromEmbedded(network);
      const commits = queryDTCommits(world, components, account.id);
      const sacrificeCommits = querySacrificeCommits(world, components, account.id);

      return {
        network: layers.network,
        data: { commits, sacrificeCommits },
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
      commits.map((commit) => DTRevealer.add(commit, 'droptable'));
      sacrificeCommits.map((commit) => DTRevealer.add(commit, 'sacrifice'));
    }, [commits, sacrificeCommits, blockNumber]);

    useEffect(() => {
      executeDroptableReveal();
      executeSacrificeReveal();
    }, [blockNumber]);

    /////////////////
    // REVEAL LOGIC

    async function executeDroptableReveal() {
      const commits = DTRevealer.extractQueue('droptable');
      if (commits.length === 0) return;

      const actionIndex = await revealTx(commits, 'droptable');
      DTRevealer.finishReveal(actionIndex, commits);
    }

    async function executeSacrificeReveal() {
      const commits = DTRevealer.extractQueue('sacrifice');
      if (commits.length === 0) return;

      const actionIndex = await revealTx(commits, 'sacrifice');
      DTRevealer.finishReveal(actionIndex, commits);
    }

    async function overrideExecute(commits: EntityID[]) {
      if (commits.length === 0) return;

      DTRevealer.forceQueue(commits);
      const actionIndex = await revealTx(commits, 'droptable');
      DTRevealer.finishReveal(actionIndex, commits);
    }

    /////////////////
    // TRANSACTIONS

    const revealTx = async (
      commits: EntityID[],
      type: 'droptable' | 'sacrifice'
    ): Promise<EntityIndex> => {
      const config = {
        droptable: {
          action: 'Droptable reveal',
          description: 'Inspecting item contents',
          execute: () => api.player.droptable.reveal(commits),
        },
        sacrifice: {
          action: 'Sacrifice reveal',
          description: 'Revealing MicroKami',
          execute: () => api.player.pet.sacrificeReveal(commits),
        },
      };

      const actionIndex = actions.add({
        action: config[type].action,
        params: [commits],
        description: config[type].description,
        execute: async () => config[type].execute(),
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
  padding: 0.4vh 1.2vw;
`;
