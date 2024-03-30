import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { Kami } from 'layers/network/shapes/Kami';
import { getLiquidationConfig } from 'layers/network/shapes/LiquidationConfig';
import { Node, getNodeByIndex } from 'layers/network/shapes/Node';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { useSelected } from 'layers/react/store';
import { Banner } from './Banner';
import { Kards } from './Kards';
import { Tabs } from './Tabs';

// merchant window with listings. assumes at most 1 merchant per room
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
          const { nodeIndex } = useSelected.getState();

          const account = getAccountFromBurner(network, { kamis: true, inventory: true });
          const liquidationConfig = getLiquidationConfig(world, components);
          const node = getNodeByIndex(world, components, nodeIndex, {
            kamis: true,
            accountID: account?.id,
          });

          return {
            network,
            data: { account, liquidationConfig, node },
          };
        })
      ),

    // Render
    ({ data, network }) => {
      // console.log('NodeM: data', data);
      const { account, liquidationConfig } = data;
      const { actions, api, components, world } = network;
      const [tab, setTab] = useState('allies');
      const { nodeIndex } = useSelected();
      const [node, setNode] = useState<Node>(data.node);

      // updates from selected Node updates
      useEffect(() => {
        const nodeOptions = { kamis: true, accountID: account.id };
        setNode(getNodeByIndex(world, components, nodeIndex, nodeOptions));
      }, [nodeIndex]);

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
          divName='node'
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
            battleConfig={liquidationConfig}
            tab={tab}
          />
        </ModalWrapper>
      );
    }
  );
}
