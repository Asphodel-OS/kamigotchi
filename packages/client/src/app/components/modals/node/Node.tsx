import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { EmptyText, ModalWrapper } from 'app/components/library';
import { UseItemButton } from 'app/components/library/actions';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { feedIcon } from 'assets/images/icons/actions';
import { Account, BaseAccount, getAccountFromBurner } from 'network/shapes/Account';
import { Allo, parseAllos } from 'network/shapes/Allo';
import { Condition, parseConditionalText } from 'network/shapes/Conditional';
import { queryDTCommits } from 'network/shapes/Droptable';
import {
  Kami,
  KamiOptions,
  getKami,
  getKamiAccount,
  queryKamisByAccount,
  updateKamiHarvestRate,
} from 'network/shapes/Kami';
import {
  Node,
  NullNode,
  getNodeByIndex,
  passesNodeReqs,
  queryNodeKamis,
} from 'network/shapes/Node';
import { ScavBar, getScavBarFromHash, getScavPoints } from 'network/shapes/Scavenge';
import { getKamiTraits } from 'network/shapes/Trait';
import { getLastTime } from 'network/shapes/utils/time';
import { waitForActionCompletion } from 'network/utils';
import { Banner } from './header/Banner';
import { Kards } from './kards/Kards';

const HARVEST_STALE_LIMIT = 60 * 1000; // 1 minute

// cache for harvest rates of enemy kamis
const KamiCache = new Map<EntityIndex, Kami>();
const KamiLastTs = new Map<EntityIndex, number>(); // kami index -> last update ts
const HarvestUpdateTs = new Map<EntityIndex, number>();
const OwnerCache = new Map<EntityIndex, BaseAccount>();

export function registerNodeModal() {
  registerUIComponent(
    'NodeModal',

    // Grid Config
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 3,
      rowEnd: 99,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const { nodeIndex } = useSelected.getState();

          const account = getAccountFromBurner(network, { inventory: true });

          return {
            network,
            data: {
              account,
              kamiEntities: {
                account: queryKamisByAccount(components, account.id),
                node: queryNodeKamis(world, components, nodeIndex),
              },
              commits: queryDTCommits(world, components, account.id),
            },
            display: {
              UseItemButton: (kami: Kami, account: Account) =>
                UseItemButton(network, kami, account, feedIcon),
            },
            utils: {
              getKami: (entity: EntityIndex, options?: KamiOptions) =>
                getKami(world, components, entity, options),
              getKamiTraits: (entity: EntityIndex) => getKamiTraits(world, components, entity),
              getLastTime: (entity: EntityIndex) => getLastTime(components, entity),
              getOwner: (kamiIndex: number) => getKamiAccount(world, components, kamiIndex),
              getScavPoints: (nodeIndex: number) =>
                getScavPoints(world, components, 'node', nodeIndex, account.id),
              passesNodeReqs: (kami: Kami) =>
                passesNodeReqs(world, components, nodeIndex, account, kami),
              parseConditionalText: (condition: Condition, tracking?: boolean) =>
                parseConditionalText(world, components, condition, tracking),
              getScavBarFromHash: (nodeIndex: number) =>
                getScavBarFromHash(world, components, 'node', nodeIndex),
              parseAllos: (scavAllo: Allo[], flatten?: boolean) =>
                parseAllos(world, components, scavAllo, flatten),
            },
          };
        })
      ),

    // Render
    ({ data, display, network, utils }) => {
      // console.log('Node Modal Data', data);
      const { account, kamiEntities } = data;
      const {
        actions,
        api,
        components,
        world,
        localSystems: { DTRevealer },
      } = network;
      const { nodeIndex } = useSelected();
      const { setModals } = useVisibility();
      const [node, setNode] = useState<Node>(NullNode);

      // updates from selected Node updates
      useEffect(() => {
        let node = getNodeByIndex(world, components, nodeIndex);
        if (node.index == 0) setModals({ node: false }); // NullNode
        setNode(node);
      }, [nodeIndex]);

      /////////////////
      // CACHE OPERATIONS

      // retrieve a kami's most recent data and update it on the cache
      const processKami = (entity: EntityIndex, options?: KamiOptions) => {
        const kamiOptions = { harvest: true, traits: true };
        const kami = utils.getKami(entity, kamiOptions);
        KamiCache.set(entity, kami);
        KamiLastTs.set(entity, kami.time.last);
        HarvestUpdateTs.set(entity, Date.now());
        return kami;
      };

      // get a kami from the cache or live pool
      const getKami = (entity: EntityIndex) => {
        if (!KamiLastTs.has(entity)) processKami(entity);
        return KamiCache.get(entity)!;
      };

      // refresh a kami as needed and return the most recent instance
      const refreshKami = (kami: Kami) => {
        const entityIndex = kami.entityIndex;

        // reprocess any updated kamis
        const lastTime = utils.getLastTime(entityIndex);
        const lastUpdate = KamiLastTs.get(entityIndex)!;
        const wasUpdated = lastTime > lastUpdate;
        if (wasUpdated) kami = processKami(entityIndex);

        // recalculate rates for any stale harvests
        const now = Date.now();
        const lastHarvestUpdate = HarvestUpdateTs.get(entityIndex) ?? 0;
        if (now - lastHarvestUpdate > HARVEST_STALE_LIMIT) {
          updateKamiHarvestRate(kami);
          HarvestUpdateTs.set(entityIndex, now);
        }
        return kami;
      };

      // get and cache owner lookups. if owner is null, update the cache
      const getOwner = (kami: Kami) => {
        let owner = OwnerCache.get(kami.entityIndex);
        if (!owner || !owner.index) {
          owner = utils.getOwner(kami.index);
          OwnerCache.set(kami.entityIndex, owner);
        }
        return owner;
      };

      /////////////////
      // ACTIONS

      // collects on an existing harvest
      const collect = (kami: Kami) => {
        actions.add({
          action: 'HarvestCollect',
          params: [kami.id],
          description: `Collecting ${kami.name}'s Harvest`,
          execute: async () => {
            return api.player.harvest.collect(kami.harvest!.id);
          },
        });
      };

      // liquidate a harvest
      // assume this function is only called with two kamis that have harvests
      const liquidate = (myKami: Kami, enemyKami: Kami) => {
        actions.add({
          action: 'HarvestLiquidate',
          params: [enemyKami.harvest!.id, myKami.id],
          description: `Liquidating ${enemyKami.name} with ${myKami.name}`,
          execute: async () => {
            return api.player.harvest.liquidate(enemyKami.harvest!.id, myKami.id);
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
            return api.player.harvest.start(kami.id, node.id);
          },
        });
      };

      // stops a harvest
      const stop = (kami: Kami) => {
        actions.add({
          action: 'HarvestStop',
          params: [kami.harvest!.id],
          description: `Removing ${kami.name} from ${kami.harvest!.node?.name}`,
          execute: async () => {
            return api.player.harvest.stop(kami.harvest!.id);
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
              kamiEntities={kamiEntities.account}
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
          {kamiEntities.node.length === 0 && (
            <EmptyText
              text={['There are no Kamis on this node.', "Maybe that's an opportunity.."]}
              size={1}
            />
          )}
          <Kards
            account={account}
            kamiEntities={kamiEntities}
            actions={{ collect, liquidate, stop }}
            display={display}
            utils={{ getKami, refreshKami, getOwner }}
          />
        </ModalWrapper>
      );
    }
  );
}
