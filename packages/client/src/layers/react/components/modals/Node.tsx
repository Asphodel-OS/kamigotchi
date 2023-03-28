import React, { useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  runQuery,
} from '@latticexyz/recs';

import { registerUIComponent } from 'layers/react/engine/store';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { getAccount } from 'layers/react/components/shapes/Account';
import { Kami } from 'layers/react/components/shapes/Kami';
import { getNode, Node } from 'layers/react/components/shapes/Node';
import { Production } from 'layers/react/components/shapes/Production';
import { KamiCard } from '../library/KamiCard';
import Battery from '../library/Battery';

// merchant window with listings. assumes at most 1 merchant per room
export function registerNodeModal() {
  registerUIComponent(
    'NodeModal',

    // Grid Config
    {
      colStart: 33,
      colEnd: 65,
      rowStart: 2,
      rowEnd: 60,
    },

    // Requirement (Data Manangement)
    (layers) => {
      const {
        network: {
          world,
          api: { player },
          network,
          components: {
            IsNode,
            IsAccount,
            Location,
            AccountID,
            OperatorAddress,
          },
          actions,
        },
      } = layers;

      return merge(AccountID.update$, Location.update$).pipe(
        map(() => {
          // get the account entity of the controlling wallet
          const accountIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(OperatorAddress, {
                value: network.connectedAddress.get(),
              }),
            ])
          )[0];

          const account =
            accountIndex !== undefined
              ? getAccount(layers, accountIndex, { kamis: true })
              : false;

          let node: Node;
          let kamis: any;
          // Prevent multiple computations on undefined values.
          if (account) {
            // get the current room node, if there is one
            // TODO: update this to support node input as props
            const nodeResults = Array.from(
              runQuery([
                Has(IsNode),
                HasValue(Location, { value: account.location }),
              ])
            );
            if (nodeResults.length > 0) {
              node = getNode(layers, nodeResults[0], { productions: true });
            }
            kamis = account.kamis;
            // filter by just the kamis active on the current node
            if (account.kamis) {
              const kamisOnNode = account.kamis.filter((kami) => {
                if (!node) return false;

                if (kami.production && kami.production.state === 'ACTIVE') {
                  return kami.production?.node?.id === node.id;
                }
              });
              account.kamis = kamisOnNode;
            }
          }

          return {
            actions,
            api: player,
            kamis,
            data: {
              account, // account => kami[] => production
              node, // node => production[] => kami
            } as any,
          };
        })
      );
    },

    // Render
    ({ actions, api, data, kamis }) => {
      // hide this component if merchant.index == 0

      ///////////////////
      // ACTIONS

      // collects on an existing production
      const collect = (production: Production) => {
        const actionID = `Collecting Harvest` as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          // on: data.????,
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.production.collect(production.id);
          },
        });
      };

      // liquidate a production
      const liquidate = (production: Production, kami: Kami) => {
        const actionID = `Liquidating ${production.kami?.name}` as EntityID; // itemIndex should be replaced with the item's name
        actions.add({
          id: actionID,
          components: {},
          // on: data.account.index, // what's the appropriate value here?
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.production.liquidate(production.id, kami.id);
          },
        });
      };

      // stops a production
      const stop = (production: Production) => {
        const actionID = `Stopping Harvest` as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          // on: data.????,
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.production.stop(production.id);
          },
        });
      };

      ///////////////////
      // DISPLAY

      // collect production action button
      const CollectButton = (kami: Kami) => (
        <ActionButton
          id={`harvest-collect`}
          onClick={() => collect(kami.production!)}
          text="Collect"
        />
      );

      // stop production action button
      const StopButton = (kami: Kami) => (
        <ActionButton
          id={`harvest-stop`}
          onClick={() => stop(kami.production!)}
          text="Stop"
        />
      );

      // liquidate production action button
      const LiquidateButton = (production: Production, kami: Kami) => (
        <ActionButton
          id={`harvest-stop`}
          onClick={() => liquidate(kami.production!, kami)}
          text="Stop"
        />
      );

      const isHarvesting = (kami: any): boolean => {
        return kami.production && kami.production.state === 'ACTIVE';
      };

      // rendering of my kami on this node
      // NOTE: the smart contract does not currently gate multiple kamis being
      // on the same node. The above data population just grabs the first one.
      const MyKami = (kami: Kami) => {
        // @DV implement me
        // no need to add a collect button just yet (single action should be easier)
        const description = () => {
          const description = [];
          description.push(`${parseInt(kami.health)}/${parseInt(kami.health)}`);
          description.push(`Violence: 42`);
          description.push(`$KAMI: ${5000} (${5}/hr)`);

          return description;
        };

        const action = isHarvesting(kami)
          ? StopButton(kami)
          : CollectButton(kami);

        return (
          <KamiCard
            key={kami.id}
            title={kami.name}
            image={kami.uri}
            subtext={'you'}
            action={action}
            cornerContent={<Battery percentage={55} />}
            description={description()}
          />
        );
      };

      // the rendering of all the enemy kamis on this node
      // may be easier/better to pass in the list of Productions instead
      const EnemyProductions = (productions: Production[]) => {
        // @DV implement me
      };

      // rendering will depend on whether a node is present in the room
      const NodeInfo = (node: Node) => {
        // @DV implement me
      };

      return (
        <ModalWrapperFull id="node" divName="node">
          {/* @DV implement me, look at rendering step of Party.tsx for reference */}
          <Scrollable>{kamis?.length && MyKami(kamis[0])}</Scrollable>
        </ModalWrapperFull>
      );
    }
  );
}

const Scrollable = styled.div`
  overflow: auto;
  max-height: 100%;
`;
