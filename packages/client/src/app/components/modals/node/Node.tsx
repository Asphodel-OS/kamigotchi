import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected } from 'app/stores';
import { getAccountFromBurner } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { Node, NullNode, getNodeByIndex } from 'network/shapes/Node';
import { Banner } from './Banner';
import { Kards } from './Kards';

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

          return {
            network,
            data: { account, node },
          };
        })
      ),

    // Render
    ({ data, network }) => {
      // console.log('Node Modal Data', data);
      const { account } = data;
      const { actions, api, components, world } = network;
      const [tab, setTab] = useState('allies');
      const { nodeIndex } = useSelected();
      const [node, setNode] = useState<Node>(data.node);

      // updates from selected Node updates
      useEffect(() => {
        const nodeOptions = { kamis: true, accountID: account.id };
        let node = getNodeByIndex(world, components, nodeIndex, nodeOptions);
        if (!node) node = NullNode;
        setNode(node);
      }, [nodeIndex]);

      // updates from component subscription updates
      useEffect(() => {
        setNode(data.node);
      }, [data.node]);

      const getTotalKamis = () => {
        return (node.kamis?.allies ?? []).length + (node.kamis?.enemies ?? []).length;
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
          ]}
          canExit
          noPadding
          truncate
        >
          {getTotalKamis() > 0 ? (
            <Kards
              account={account}
              allies={node.kamis?.allies!}
              enemies={node.kamis?.enemies!}
              actions={{ collect, feed, liquidate, stop }}
              tab={tab}
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
