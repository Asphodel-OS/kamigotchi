import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { getAccount, getAccountInventories, getAccountKamis } from 'app/cache/account';
import { getKami, getKamiAccount } from 'app/cache/kami';
import { getNodeByIndex } from 'app/cache/node';
import { EmptyText, ModalWrapper } from 'app/components/library';
import { UseItemButton } from 'app/components/library/actions';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { feedIcon } from 'assets/images/icons/actions';
import {
  Account,
  NullAccount,
  queryAccountFromEmbedded,
  queryAccountKamis,
} from 'network/shapes/Account';
import { Allo, parseAllos } from 'network/shapes/Allo';
import { Condition, parseConditionalText } from 'network/shapes/Conditional';
import { queryDTCommits } from 'network/shapes/Droptable';
import { Kami } from 'network/shapes/Kami';
import {
  Node,
  NullNode,
  passesNodeReqs,
  queryNodeByIndex,
  queryNodeKamis,
} from 'network/shapes/Node';
import { getScavBarFromHash, getScavPoints, ScavBar } from 'network/shapes/Scavenge/';
import { waitForActionCompletion } from 'network/utils';
import { Banner } from './header/Banner';
import { Kards } from './kards/Kards';

// live kami data staleness limit in seconds
const LIVE_UPDATE_LIMIT = 2;

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

          const accountEntity = queryAccountFromEmbedded(network);
          const accountID = world.entities[accountEntity];
          const accountRefreshOptions = {
            live: LIVE_UPDATE_LIMIT,
            inventories: LIVE_UPDATE_LIMIT,
          };

          const nodeEntity = queryNodeByIndex(world, nodeIndex);
          const kamiRefreshOptions = {
            live: LIVE_UPDATE_LIMIT,
            bonuses: 3600,
            config: 3600,
            harvest: LIVE_UPDATE_LIMIT,
            progress: 3600,
            skills: 3600,
            stats: 3600,
            traits: 3600,
          };

          return {
            network,
            data: {
              accountEntity,
              inventories: getAccountInventories(world, components, accountEntity),
              kamiEntities: {
                account: queryAccountKamis(world, components, accountEntity),
                node: queryNodeKamis(world, components, nodeEntity),
              },
              commits: queryDTCommits(world, components, accountID), // TODO: query by entity index?
            },
            display: {
              UseItemButton: (kami: Kami, account: Account) =>
                UseItemButton(network, kami, account, feedIcon),
            },
            utils: {
              getAccount: () => getAccount(world, components, accountEntity, accountRefreshOptions),
              getAccountKamis: () =>
                getAccountKamis(world, components, accountEntity, kamiRefreshOptions),
              getKami: (entity: EntityIndex) =>
                getKami(world, components, entity, kamiRefreshOptions),
              getNode: (index: number) => getNodeByIndex(world, components, index),
              getOwner: (kamiEntity: EntityIndex) => getKamiAccount(world, components, kamiEntity),

              // node header functions..
              // TODO: clean up this mess
              getScavPoints: () => getScavPoints(world, components, 'node', nodeIndex, accountID), // TODO: query by entity index?
              passesNodeReqs: (kami: Kami) => passesNodeReqs(world, components, nodeIndex, kami),
              parseConditionalText: (condition: Condition, tracking?: boolean) =>
                parseConditionalText(world, components, condition, tracking),
              getScavBar: () => getScavBarFromHash(world, components, 'node', nodeIndex),
              parseAllos: (scavAllo: Allo[], flatten?: boolean) =>
                parseAllos(world, components, scavAllo, flatten),
            },
          };
        })
      ),

    // Render
    ({ data, display, network, utils }) => {
      // console.log('Node Modal Data', data);
      const { accountEntity, inventories, kamiEntities } = data;
      const {
        actions,
        api,
        world,
        localSystems: { DTRevealer },
      } = network;
      const { getAccount, getNode } = utils;
      const { nodeIndex } = useSelected();
      const { modals, setModals } = useVisibility();

      const [account, setAccount] = useState<Account>(NullAccount);
      const [node, setNode] = useState<Node>(NullNode);
      const [lastRefresh, setLastRefresh] = useState(Date.now());

      // ticking
      useEffect(() => {
        const refreshClock = () => setLastRefresh(Date.now());
        const timerId = setInterval(refreshClock, 1000);
        return () => clearInterval(timerId);
      }, []);

      // refresh account data whenever the modal is opened
      useEffect(() => {
        if (!modals.node) return;
        setAccount(getAccount());
      }, [modals.node, lastRefresh]);

      // updates from selected Node updates
      useEffect(() => {
        if (!nodeIndex) setModals({ node: false }); // NullNode
        setNode(getNode(nodeIndex));
      }, [nodeIndex]);

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

      // claim the scavenge at the given scavenge bar
      const claim = async (scavBar: ScavBar) => {
        DTRevealer.nameEntity('scavenge' as EntityID, scavBar.id);
        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'ScavengeClaim',
          params: [scavBar.type, scavBar.index], // actual param: scavBar.id
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
              data={{ account, node, kamiEntities: kamiEntities.account }}
              actions={{ claim, addKami: (kami) => start(kami, node) }}
              utils={utils}
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
            inventories={inventories}
            kamiEntities={kamiEntities}
            actions={{ collect, liquidate, stop }}
            display={display}
            utils={utils}
          />
        </ModalWrapper>
      );
    }
  );
}
