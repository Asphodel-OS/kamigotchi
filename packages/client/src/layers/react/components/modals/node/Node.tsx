import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import { EntityID } from '@latticexyz/recs';
import crypto from "crypto";

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
      rowStart: 14,
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
            Balance,
            Coin,
            Harmony,
            Health,
            HealthCurrent,
            LastTime,
            Location,
            MediaURI,
            Name,
            Rate,
            StartTime,
            State,
            Type,
            Value,
            Violence,
          },
        },
      } = layers;

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
        Balance.update$,
        Coin.update$,
        Harmony.update$,
        Health.update$,
        HealthCurrent.update$,
        LastTime.update$,
        Location.update$,
        MediaURI.update$,
        Name.update$,
        Rate.update$,
        StartTime.update$,
        State.update$,
        Type.update$,
        Value.update$,
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
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'ProductionCollect',
          params: [kami.id],
          description: `Collecting ${kami.name}'s Harvest`,
          execute: async () => {
            return api.production.collect(kami.production!.id);
          },
        });
      };

      // feed a kami
      const feed = (kami: Kami, foodIndex: number) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'KamiFeed',
          params: [kami.id, foodIndex],
          description: `Feeding ${kami.name}`,
          execute: async () => {
            return api.pet.feed(kami.id, foodIndex);
          },
        });
      };

      // liquidate a production
      // assume this function is only called with two kamis that have productions
      const liquidate = (myKami: Kami, enemyKami: Kami) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'ProductionLiquidate',
          params: [enemyKami.production!.id, myKami.id],
          description: `Liquidating ${enemyKami.name} with ${myKami.name}`,
          execute: async () => {
            return api.production.liquidate(enemyKami.production!.id, myKami.id);
          },
        });
      };

      // starts a production for the given pet and node
      const start = (kami: Kami, node: Node) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'ProductionStart',
          params: [kami.id, node.id],
          description: `Placing ${kami.name} on ${node.name}`,
          execute: async () => {
            return api.production.start(kami.id, node.id);
          },
        });
      };

      // stops a production
      const stop = (kami: Kami) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'ProductionStop',
          params: [kami.production!.id],
          description: `Removing ${kami.name} from ${kami.production!.node?.name}`,
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
            battleConfig={data.liquidationConfig}
            tab={tab}
          />
        </ModalWrapperFull>
      );
    }
  );
}
