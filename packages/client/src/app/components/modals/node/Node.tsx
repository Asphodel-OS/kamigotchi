import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { getAccount, getAccountKamis } from 'app/cache/account';
import { getBonusesForEndType, getTempBonuses } from 'app/cache/bonus';
import { getKami, getKamiAccount } from 'app/cache/kami';
import { getNodeByIndex } from 'app/cache/node';
import { getRoomByIndex } from 'app/cache/room';
import { EmptyText, ModalWrapper, UseItemButton, ActionButton, TextTooltip } from 'app/components/library';
import { TravelConfirm } from '../travel/Confirm';
import { findPathAndCost } from 'network/shapes/Room/path';
import { UIComponent } from 'app/root/types';
import { useSelected, useVisibility } from 'app/stores';
import { FeedIcon } from 'assets/images/icons/actions';
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
import { queryScavInstance, ScavBar } from 'network/shapes/Scavenge/';
import { getValue } from 'network/shapes/utils/component';
import { waitForActionCompletion } from 'network/utils';
import { Header } from './header/Header';
import { Kards } from './kards/Kards';

// live kami data staleness limit in seconds
const LIVE_UPDATE_LIMIT = 2;

export const NodeModal: UIComponent = {
  id: 'NodeModal',
  requirement: (layers) =>
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
          friends: 60,
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
            kamiEntities: {
              account: queryAccountKamis(world, components, accountEntity),
              node: queryNodeKamis(world, components, nodeEntity),
            },
            commits: queryDTCommits(world, components, accountID),
          },
          display: {
            UseItemButton: (kami: Kami, account: Account) =>
              UseItemButton(network, kami, account, FeedIcon),
          },
          utils: {
            getAccount: () => getAccount(world, components, accountEntity, accountRefreshOptions),
            getAccountKamis: () =>
              getAccountKamis(world, components, accountEntity, kamiRefreshOptions),
            getBonuses: (entity: EntityIndex) =>
              getBonusesForEndType(
                world,
                components,
                'UPON_HARVEST_ACTION',
                entity,
                LIVE_UPDATE_LIMIT
              ),
            getKami: (entity: EntityIndex) =>
              getKami(world, components, entity, kamiRefreshOptions),
            getOwner: (kamiEntity: EntityIndex) =>
              getKamiAccount(world, components, kamiEntity, accountRefreshOptions),
            getNode: (index: number) => getNodeByIndex(world, components, index),
            getRoom: (index: number) => getRoomByIndex(world, components, index),
            getScavenge: (index: number) => getNodeByIndex(world, components, index).scavenge,
            getValue: (entity: EntityIndex) => getValue(components, entity),
            parseAllos: (allos: Allo[]) => parseAllos(world, components, allos, true),
            queryScavInstance: (index: number, holderID: EntityID) =>
              queryScavInstance(world, 'NODE', index, holderID),
            // node header functions..
            // TODO: clean up this mess
            passesNodeReqs: (kami: Kami) => passesNodeReqs(world, components, nodeIndex, kami),
            parseConditionalText: (condition: Condition, tracking?: boolean) =>
              parseConditionalText(world, components, condition, tracking),
            getTempBonuses: (kami: Kami) =>
              getTempBonuses(world, components, kami.entity, kamiRefreshOptions.bonuses),
          },
        };
      })
    ),

  Render: ({ data, display, network, utils }) => {
      const { kamiEntities } = data;
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
      const [travelTarget, setTravelTarget] = useState<number | null>(null);
      const [travelAccount, setTravelAccount] = useState<Account | null>(null);
      const { components } = network;

      const getTravelStats = () => {
        const acc = getAccount();
        const { moves, staminaCost } = findPathAndCost(world, components, acc.roomIndex, node.index);
        return { moves, staminaCost };
      };

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
        const node = getNode(nodeIndex);
        if (!node.index) setModals({ node: false }); // NullNode
        setNode(node);
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
            return api.player.pet.harvest.collect([kami.harvest!.id]);
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
            return api.player.pet.harvest.liquidate(enemyKami.harvest!.id, myKami.id);
          },
        });
      };

      // starts a harvest for the given pet and node
      const start = (kami: Kami, node: Node) => {
        actions.add({
          action: 'HarvestStart',
          params: [kami.id, node.id],
          description: `Placing ${kami.name}  on ${node.name}`,
          execute: async () => {
            return api.player.pet.harvest.start([kami.id], node.index);
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
            return api.player.pet.harvest.stop([kami.harvest!.id]);
          },
        });
      };

      // claim the scavenge at the given scavenge bar
      const claim = async (scavBar: ScavBar) => {
        DTRevealer.nameEntity('scavenge' as EntityID, scavBar.id);
        const node = getNode(scavBar.index);

        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'ScavengeClaim',
          params: [scavBar.type, scavBar.index], // actual param: scavBar.id
          description: `Claiming scavenge at node ${node.name}`,
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

      const travelStats = getTravelStats();
      const hasYourKamiHere = kamiEntities.node.some((e: number) => kamiEntities.account.includes(e));

      return (
        <ModalWrapper
          id='node'
          header={[
            <Header
              key='banner'
              data={{ account, node, kamiEntities: kamiEntities.account }}
              actions={{ claim, addKami: (kami: Kami) => start(kami, node) }}
              utils={utils}
            />,
          ]}
          canExit
          truncate
          noPadding
        >
          {node.index !== 0 && hasYourKamiHere && (
            <div style={{ padding: '0.6vw', display: 'flex', justifyContent: 'flex-end' }}>
              <TextTooltip
                text={[`${travelStats.moves} moves`, `${travelStats.staminaCost} stamina`]}
                direction='row'
              >
                <ActionButton
                  text='Travel to your Kami'
                  disabled={travelStats.moves === 0}
                  onClick={() => {
                    const fresh = getAccount();
                    setTravelAccount(fresh);
                    setTravelTarget(node.index);
                    setModals({ ...modals, travelConfirm: true });
                  }}
                />
              </TextTooltip>
            </div>
          )}
          {kamiEntities.node.length + kamiEntities.account.length === 0 && (
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
            utils={utils}
          />
          {travelTarget !== null && travelAccount && modals.travelConfirm && (
            <TravelConfirm
              network={network}
              account={travelAccount}
              targetRoomIndex={travelTarget}
              onClose={() => {
                setTravelTarget(null);
                setTravelAccount(null);
                setModals({ ...modals, travelConfirm: false });
              }}
            />
          )}
        </ModalWrapper>
        );
  },
};
