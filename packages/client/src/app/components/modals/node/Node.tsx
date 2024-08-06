import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { getAccountFromBurner } from 'network/shapes/Account';
import { parseConditionalText } from 'network/shapes/Conditional';
import { NullDT, getDTDetails, queryDTCommits } from 'network/shapes/Droptable';
import { Kami } from 'network/shapes/Kami';
import { Node, NullNode, getNodeByIndex } from 'network/shapes/Node';
import { passesNodeReqs } from 'network/shapes/Node/functions';
import { ScavBar, getScavBarFromHash, getScavPoints } from 'network/shapes/Scavenge';
import { Commit, filterRevealable } from 'network/shapes/utils';
import { waitForActionCompletion } from 'network/utils';
import { playClick } from 'utils/sounds';
import { useAccount, useWatchBlockNumber } from 'wagmi';
import { Banner } from './Banner';
import { Kards } from './Kards';
import { ScavengeBar } from './ScavengeBar';

export function registerNodeModal() {
  registerUIComponent(
    'NodeModal',

    // Grid Config
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 12,
      rowEnd: 99,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const { nodeIndex } = useSelected.getState();

          const account = getAccountFromBurner(network, { kamis: true, inventory: true });
          let node = getNodeByIndex(world, components, nodeIndex, {
            kamis: true,
            accountID: account?.id,
          });
          if (!node) node = NullNode;

          // reveal flow
          const commits = queryDTCommits(world, components, account.id);

          return {
            network,
            data: { account, node, commits },
          };
        })
      ),

    // Render
    ({ data, network }) => {
      // console.log('Node Modal Data', data);
      const { account } = data;
      const { actions, api, components, world } = network;
      const { nodeIndex } = useSelected();
      const { modals, setModals } = useVisibility();
      const [node, setNode] = useState<Node>(data.node);
      const [scavBar, setScavBar] = useState<ScavBar | undefined>(undefined);

      // updates from selected Node updates
      useEffect(() => {
        const nodeOptions = { kamis: true, accountID: account.id };
        let node = getNodeByIndex(world, components, nodeIndex, nodeOptions);
        if (!node) {
          node = NullNode;
          setModals({ ...modals, node: false });
        }

        const scav = getScavBarFromHash(world, components, 'node', node.index);

        setScavBar(scav);
        setNode(node);
      }, [nodeIndex]);

      // updates from component subscription updates
      useEffect(() => {
        setNode(data.node);
      }, [data.node]);

      const getTotalKamis = () => {
        return (node.kamis?.allies ?? []).length + (node.kamis?.enemies ?? []).length;
      };

      const getDrops = () => {
        return {
          node: node.drops ?? [],
          scavenge: getDTDetails(world, components, scavBar?.rewards[0].droptable ?? NullDT),
        };
      };

      ///////////////////
      // REVEAL FLOW

      const { isConnected } = useAccount();
      const [blockNumber, setBlockNumber] = useState(BigInt(0));
      const [triedReveal, setTriedReveal] = useState(true);
      const [waitingToReveal, setWaitingToReveal] = useState(false);

      useWatchBlockNumber({
        onBlockNumber: (n) => {
          setBlockNumber(n);
        },
      });

      useEffect(() => {
        const tx = async () => {
          if (!isConnected) return;

          const filtered = filterRevealable(data.commits, Number(blockNumber));
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
      }, [data.commits]);

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
        return;
      };

      const handleCommit = async (scavBar: ScavBar) => {
        playClick();
        try {
          await scavClaim(scavBar);

          setWaitingToReveal(true);
          setTriedReveal(false);
        } catch (e) {
          console.log('Node.tsx: handleOpen() open failed', e);
        }
      };

      const handleReveal = async (commits: Commit[]) => {
        await revealTx(commits);

        // wait to give buffer for rpc
        await new Promise((resolve) => setTimeout(resolve, 500));
      };

      ///////////////////
      // ACTIONS

      // collects on an existing harvest
      const collect = (kami: Kami) => {
        actions.add({
          action: 'HarvestCollect',
          params: [kami.id],
          description: `Collecting ${kami.name}'s Harvest`,
          execute: async () => {
            return api.player.production.collect(kami.production!.id);
          },
        });
      };

      // feed a kami
      const feed = (kami: Kami, itemIndex: number) => {
        actions.add({
          action: 'KamiFeed',
          params: [kami.id, itemIndex],
          description: `Feeding ${kami.name}`,
          execute: async () => {
            return api.player.pet.feed(kami.id, itemIndex);
          },
        });
      };

      // liquidate a harvest
      // assume this function is only called with two kamis that have harvests
      const liquidate = (myKami: Kami, enemyKami: Kami) => {
        actions.add({
          action: 'HarvestLiquidate',
          params: [enemyKami.production!.id, myKami.id],
          description: `Liquidating ${enemyKami.name} with ${myKami.name}`,
          execute: async () => {
            return api.player.production.liquidate(enemyKami.production!.id, myKami.id);
          },
        });
      };

      // starts a harvest for the given pet and node
      const start = (kami: Kami, node: Node) => {
        actions.add({
          action: 'HarvestStart',
          params: [kami.id, node.id],
          description: `Placing ${kami.name} on ${node.name}`,
          execute: async () => {
            return api.player.production.start(kami.id, node.id);
          },
        });
      };

      // stops a harvest
      const stop = (kami: Kami) => {
        actions.add({
          action: 'HarvestStop',
          params: [kami.production!.id],
          description: `Removing ${kami.name} from ${kami.production!.node?.name}`,
          execute: async () => {
            return api.player.production.stop(kami.production!.id);
          },
        });
      };

      const scavClaim = async (scavBar: ScavBar) => {
        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'ScavengeClaim',
          params: [scavBar.field, scavBar.index], // actual param: scavBar.id
          description: `Claiming scavenge at node ${scavBar.index}`,
          execute: async () => {
            return api.player.scavenge.claim(scavBar.id);
          },
        });
        await waitForActionCompletion(
          actions!.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
        return actionID;
      };

      /////////////////
      // DISPLAY

      return (
        <ModalWrapper
          id='node'
          header={[
            <Banner
              key='banner'
              account={account}
              drops={getDrops()}
              node={node}
              kamis={account.kamis}
              addKami={(kami) => start(kami, node)}
              utils={{
                passesNodeReqs: (kami: Kami) =>
                  passesNodeReqs(world, components, node, account, kami),
                parseConditionalText: (condition, tracking?) =>
                  parseConditionalText(world, components, condition, tracking),
              }}
              scavBarDisplay={
                <ScavengeBar
                  scavBar={scavBar}
                  currPoints={getScavPoints(world, components, 'node', node.index, account.id)}
                  actions={{ claim: handleCommit }}
                />
              }
            />,
          ]}
          canExit
          truncate
        >
          {getTotalKamis() > 0 ? (
            <Kards
              account={account}
              allies={node.kamis?.allies!}
              enemies={node.kamis?.enemies!}
              actions={{ collect, feed, liquidate, stop }}
            />
          ) : (
            <EmptyText>
              There are no Kamis on this node. <br />
              Maybe that's an opportunity..
            </EmptyText>
          )}
        </ModalWrapper>
      );
    }
  );
}

const EmptyText = styled.div`
  height: 100%;
  margin: 1.5vh;
  padding: 1.2vh 0vw;

  color: #333;
  font-family: Pixel;
  font-size: 1.8vh;
  line-height: 4.5vh;
  text-align: center;
`;
