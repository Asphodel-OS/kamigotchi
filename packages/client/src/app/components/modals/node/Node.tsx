import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { EmptyText, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { getAccountFromBurner } from 'network/shapes/Account';
import { Condition, parseConditionalText } from 'network/shapes/Conditional';
import { Droptable, getDTDetails, queryDTCommits } from 'network/shapes/Droptable';
import { Kami, getKamiAccount } from 'network/shapes/Kami';
import { Node, NullNode, getNodeByIndex, passesNodeReqs } from 'network/shapes/Node';
import { ScavBar, getScavBarFromHash, getScavPoints } from 'network/shapes/Scavenge';
import { waitForActionCompletion } from 'network/utils';
import { Banner } from './header/Banner';
import { Kards } from './kards/Kards';

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
          let node = getNodeByIndex(world, components, nodeIndex, { kamis: true });
          if (!node) node = NullNode;

          // reveal flow
          const commits = queryDTCommits(world, components, account.id);

          return {
            network,
            data: { account, node, commits },
            utils: {
              getOwner: (kamiIndex: number) => getKamiAccount(world, components, kamiIndex),
              getScavPoints: (nodeIndex: number) =>
                getScavPoints(world, components, 'node', nodeIndex, account.id),
              passesNodeReqs: (kami: Kami) =>
                passesNodeReqs(world, components, node, account, kami),
              parseConditionalText: (condition: Condition, tracking?: boolean) =>
                parseConditionalText(world, components, condition, tracking),
              getScavBarFromHash: (nodeIndex: number) =>
                getScavBarFromHash(world, components, 'node', nodeIndex),
              getDTDetails: (dt: Droptable) => getDTDetails(world, components, dt),
            },
          };
        })
      ),

    // Render
    ({ data, network, utils }) => {
      // console.log('Node Modal Data', data);
      const { account } = data;
      const {
        actions,
        api,
        components,
        world,
        localSystems: { DTRevealer },
      } = network;
      const { nodeIndex } = useSelected();
      const { modals, setModals } = useVisibility();
      const [node, setNode] = useState<Node>(data.node);

      // updates from selected Node updates
      useEffect(() => {
        let node = getNodeByIndex(world, components, nodeIndex, { kamis: true });
        if (node.index == 0) setModals({ ...modals, node: false }); // NullNode
        setNode(node);
      }, [nodeIndex]);

      // updates from component subscription updates
      useEffect(() => {
        setNode(data.node);
      }, [data.node]);

      /////////////////
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
        DTRevealer.nameEntity('scavenge' as EntityID, scavBar.id);
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
              node={node}
              kamis={account.kamis}
              actions={{ scavClaim, addKami: (kami) => start(kami, node) }}
              utils={{
                ...utils,
                getScavPoints: () => utils.getScavPoints(node.index),
                getScavBar: () => utils.getScavBarFromHash(node.index),
              }}
            />,
          ]}
          canExit
          truncate
          noPadding
        >
          {node.kamis.length === 0 && (
            <EmptyText
              text={['There are no Kamis on this node.', "Maybe that's an opportunity.."]}
              size={1}
            />
          )}
          <Kards
            account={account}
            kamis={node.kamis}
            actions={{ collect, feed, liquidate, stop }}
            utils={utils}
          />
        </ModalWrapper>
      );
    }
  );
}
