import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import { EntityID } from '@latticexyz/recs';
import { v4 as uuidv4 } from 'uuid';

import { Banner } from './Banner';
import { Kards } from './Kards';
import { Tabs } from './Tabs';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { Kami } from 'layers/network/shapes/Kami';
import { getLiquidationConfig } from 'layers/network/shapes/LiquidationConfig';
import { Node, getNodeByIndex } from 'layers/network/shapes/Node';
import { registerUIComponent } from 'layers/react/engine/store';
import { useSelected } from 'layers/react/store/selected';


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

    // Requirement (Data Manangement)
    (layers) => {
      const { network } = layers;
      const {
        OperatorAddress,
        IsAccount,
        IsBonus,
        IsConfig,
        IsInventory,
        IsProduction,
        IsNode,
        AccountID,
        HolderID,
        PetID,
        ItemIndex,
        PetIndex,
        LastTime,
        LastActionTime,
        StartTime,
        Balance,
        Coin,
        Harmony,
        Health,
        HealthCurrent,
        Location,
        MediaURI,
        Name,
        Rate,
        State,
        Type,
        Value,
        Violence,
      } = network.components;

      // TODO: update this to support node input as props
      return merge(
        OperatorAddress.update$,
        IsAccount.update$,
        IsBonus.update$,
        IsConfig.update$,
        IsInventory.update$,
        IsNode.update$,
        IsProduction.update$,
        AccountID.update$,
        HolderID.update$,
        PetID.update$,
        ItemIndex.update$,
        PetIndex.update$,
        LastTime.update$,
        LastActionTime.update$,
        StartTime.update$,
        Balance.update$,
        Coin.update$,
        Harmony.update$,
        Health.update$,
        HealthCurrent.update$,
        Location.update$,
        MediaURI.update$,
        Name.update$,
        Rate.update$,
        State.update$,
        Type.update$,
        Value.update$,
        Violence.update$,
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(network, { kamis: true, inventory: true });
          const { nodeIndex } = useSelected.getState();
          const node = getNodeByIndex(network, nodeIndex, { kamis: true, accountID: account.id });

          return {
            network,
            data: {
              account,
              node,
              liquidationConfig: getLiquidationConfig(network),
            },
          };
        })
      );
    },

    // Render
    ({ network, data }) => {
      // console.log('NodeM: data', data);
      const { actions, api } = network;
      const [tab, setTab] = useState('allies');
      const { nodeIndex } = useSelected();
      const [node, setNode] = useState<Node>(data.node);

      // updates from selected Node updates
      useEffect(() => {
        const nodeOptions = { kamis: true, accountID: data.account.id };
        setNode(getNodeByIndex(network, nodeIndex, nodeOptions));
      }, [nodeIndex]);

      // updates from component subscription updates
      useEffect(() => {
        setNode(data.node);
      }, [data.node]);


      /////////////////// 
      // ACTIONS

      // collects on an existing production
      const collect = (kami: Kami) => {
        const actionID = uuidv4() as EntityID;
        actions?.add({
          id: actionID,
          action: 'ProductionCollect',
          params: [kami.id],
          description: `Collecting ${kami.name}'s Harvest`,
          execute: async () => {
            return api.player.production.collect(kami.production!.id);
          },
        });
      };

      // feed a kami
      const feed = (kami: Kami, foodIndex: number) => {
        const actionID = uuidv4() as EntityID;
        actions?.add({
          id: actionID,
          action: 'KamiFeed',
          params: [kami.id, foodIndex],
          description: `Feeding ${kami.name}`,
          execute: async () => {
            return api.player.pet.feed(kami.id, foodIndex);
          },
        });
      };

      // liquidate a production
      // assume this function is only called with two kamis that have productions
      const liquidate = (myKami: Kami, enemyKami: Kami) => {
        const actionID = uuidv4() as EntityID;
        actions?.add({
          id: actionID,
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
        const actionID = uuidv4() as EntityID;
        actions?.add({
          id: actionID,
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
        const actionID = uuidv4() as EntityID;
        actions?.add({
          id: actionID,
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
              account={data.account}
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
            battleConfig={data.liquidationConfig}
            tab={tab}
          />
        </ModalWrapper>
      );
    }
  );
}
