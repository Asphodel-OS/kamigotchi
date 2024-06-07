import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { EntityID, EntityIndex } from '@mud-classic/recs';
import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected } from 'app/stores';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { getKamiConfig } from 'layers/network/shapes/Config';
import { Kami } from 'layers/network/shapes/Kami';
import { Node, getNodeByIndex } from 'layers/network/shapes/Node';
import { Banner } from './Banner';
import { Kards } from './Kards';
import { Tabs } from './Tabs';

const nullNode: Node = {
  id: '0' as EntityID,
  index: 404,
  entityIndex: 0 as EntityIndex,
  type: '' as string,
  roomIndex: 0,
  name: 'Empty Node',
  description: 'There is no node in this room.',
  affinity: '' as string,
};

export function registerNodeModal() {
  registerUIComponent(
    'NodeModal',

    // Grid Config
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 14,
      rowEnd: 99,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const { roomIndex } = useSelected.getState();

          const account = getAccountFromBurner(network, { kamis: true, inventory: true });
          const kamiConfig = getKamiConfig(world, components);
          let node = getNodeByIndex(world, components, roomIndex, {
            kamis: true,
            accountID: account?.id,
          });
          if (!node) node = nullNode;

          return {
            network,
            data: { account, kamiConfig, node },
          };
        })
      ),

    // Render
    ({ data, network }) => {
      const { account, kamiConfig } = data;
      const { actions, api, components, world } = network;
      const [tab, setTab] = useState('allies');
      const { roomIndex } = useSelected();
      const [node, setNode] = useState<Node>(data.node);

      // updates from selected Node updates
      useEffect(() => {
        const nodeOptions = { kamis: true, accountID: account.id };
        let node = getNodeByIndex(world, components, roomIndex, nodeOptions);
        if (!node) node = nullNode;
        setNode(node);
      }, [roomIndex]);

      // updates from component subscription updates
      useEffect(() => {
        setNode(data.node);
      }, [data.node]);

      ///////////////////
      // ACTIONS

      // collects on an existing production
      const collect = (kami: Kami) => {
        actions.add({
          action: 'ProductionCollect',
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

      // liquidate a production
      // assume this function is only called with two kamis that have productions
      const liquidate = (myKami: Kami, enemyKami: Kami) => {
        actions.add({
          action: 'ProductionLiquidate',
          params: [enemyKami.production!.id, myKami.id],
          description: `Liquidating ${enemyKami.name} with ${myKami.name}`,
          execute: async () => {
            return api.player.production.liquidate(enemyKami.production!.id, myKami.id);
          },
        });
      };

      // starts a production for the given pet and node
      const start = (kami: Kami, node: Node) => {
        actions.add({
          action: 'ProductionStart',
          params: [kami.id, node.id],
          description: `Placing ${kami.name} on ${node.name}`,
          execute: async () => {
            return api.player.production.start(kami.id, node.id);
          },
        });
      };

      // stops a production
      const stop = (kami: Kami) => {
        actions.add({
          action: 'ProductionStop',
          params: [kami.production!.id],
          description: `Removing ${kami.name} from ${kami.production!.node?.name}`,
          execute: async () => {
            return api.player.production.stop(kami.production!.id);
          },
        });
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
              addKami={(kami) => start(kami, node)}
            />,
            <Tabs key='tabs' tab={tab} setTab={setTab} />,
          ]}
          canExit
        >
          <Kards
            account={account}
            allies={node.kamis?.allies!}
            enemies={node.kamis?.enemies!}
            actions={{ collect, feed, liquidate, stop }}
            kamiConfig={kamiConfig}
            tab={tab}
          />
        </ModalWrapper>
      );
    }
  );
}
