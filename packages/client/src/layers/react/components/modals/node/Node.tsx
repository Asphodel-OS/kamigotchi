import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import { EntityID } from '@latticexyz/recs';

import { Banner } from './Banner';
import { Kards } from './Kards';
import { Tabs } from './Tabs';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { Kami } from 'layers/react/shapes/Kami';
import { getLiquidationConfig } from 'layers/react/shapes/LiquidationConfig';
import { Node, getNodeByIndex } from 'layers/react/shapes/Node';
import { registerUIComponent } from 'layers/react/engine/store';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';


// merchant window with listings. assumes at most 1 merchant per room
export function registerNodeModal() {
  registerUIComponent(
    'NodeModal',

    // Grid Config
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 13,
      rowEnd: 99,
    },

    // Requirement (Data Manangement)
    (layers) => {
      const {
        network: {
          actions,
          api: { player },
          components: {
            OperatorAddress,
            IsNode,
            AccountID,
            Balance,
            Harmony,
            Health,
            HealthCurrent,
            Location,
            Rate,
            StartTime,
            State,
            Violence,
          },
        },
      } = layers;

      // TODO: update this to support node input as props
      return merge(
        IsNode.update$,
        OperatorAddress.update$,
        AccountID.update$,
        Balance.update$,
        Harmony.update$,
        Health.update$,
        HealthCurrent.update$,
        Location.update$,
        Rate.update$,
        StartTime.update$,
        State.update$,
        Violence.update$,
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(layers, { kamis: true, inventory: true });
          const { nodeIndex } = useSelectedEntities.getState();
          const node = getNodeByIndex(layers, nodeIndex, { kamis: true, accountID: account.id });

          return {
            layers,
            actions,
            api: player,
            data: {
              account,
              node,
              liquidationConfig: getLiquidationConfig(layers.network),
            },
          };
        })
      );
    },

    // Render
    ({ layers, actions, api, data }) => {
      // console.log('NodeM: data', data);
      const [tab, setTab] = useState('allies');
      const { nodeIndex } = useSelectedEntities();
      const [node, setNode] = useState<Node>(data.node);

      // updates from selected Node updates
      useEffect(() => {
        setNode(getNodeByIndex(layers, nodeIndex, { kamis: true, accountID: data.account.id }));
      }, [nodeIndex]);

      // updates from component subscription updates
      useEffect(() => {
        setNode(data.node);
      }, [data.node]);


      /////////////////// 
      // ACTIONS

      // collects on an existing production
      const collect = (kami: Kami) => {
        const actionID = `Collecting Harvest for ${kami.name}` as EntityID; // Date.now to have the actions ordered in the component browser
        actions?.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.production.collect(kami.production!.id);
          },
        });
      };

      // feed a kami
      const feed = (kami: Kami, foodIndex: number) => {
        const actionID = `Feeding ${kami.name}` as EntityID; // Date.now to have the actions ordered in the component browser
        actions?.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.pet.feed(kami.id, foodIndex);
          },
        });
      };

      // liquidate a production
      // assume this function is only called with two kamis that have productions
      const liquidate = (myKami: Kami, enemyKami: Kami) => {
        const actionID = `Liquidating ${enemyKami.name}` as EntityID; // itemIndex should be replaced with the item's name
        actions?.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.production.liquidate(enemyKami.production!.id, myKami.id);
          },
        });
      };

      // starts a production for the given pet and node
      const start = (kami: Kami, node: Node) => {
        const actionID = `Starting Harvest for ${kami.name}` as EntityID; // Date.now to have the actions ordered in the component browser
        actions?.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.production.start(kami.id, node.id);
          },
        });
      };

      // stops a production
      const stop = (kami: Kami) => {
        const actionID = `Stopping Harvest for ${kami.name}` as EntityID; // Date.now to have the actions ordered in the component browser
        actions?.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.production.stop(kami.production!.id);
          },
        });
      };


      /////////////////
      // DISPLAY

      return (
        <ModalWrapperFull
          id='node'
          divName='node'
          header={[
            <Banner
              key='banner'
              node={node}
              kamis={data.account.kamis || []}
              addKami={(kami) => start(kami, node)}
            />,
            <Tabs key='tabs' tab={tab} setTab={setTab} />
          ]}
          canExit
        >
          <Kards
            account={data.account}
            allies={node.kamis?.allies!}
            enemies={node.kamis?.enemies!}
            actions={{ collect, feed, liquidate, stop }}
            liquidationConfig={data.liquidationConfig}
            tab={tab}
          />
        </ModalWrapperFull>
      );
    }
  );
}
