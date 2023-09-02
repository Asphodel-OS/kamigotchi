import React, { useEffect, useRef, useState, useCallback } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import {
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';
import cdf from '@stdlib/stats-base-dists-normal-cdf';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import {
  ActionListButton,
  Option as ActionListOption,
} from 'layers/react/components/library/ActionListButton';
import { KamiCard } from 'layers/react/components/library/KamiCard';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Banner } from 'layers/react/components/modals/node/Banner';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { registerUIComponent } from 'layers/react/engine/store';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { Kami, getKami } from 'layers/react/shapes/Kami';
import { getLiquidationConfig } from 'layers/react/shapes/LiquidationConfig';
import { Node, NodeKamis, getNode } from 'layers/react/shapes/Node';
import { Tabs } from './Tabs';
import { Kards } from './Kards';


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
          world,
          actions,
          api: { player },
          components: {
            AccountID,
            Balance,
            NodeID,
            PetID,
            IsNode,
            IsPet,
            IsProduction,
            HealthCurrent,
            Location,
            OperatorAddress,
            Rate,
            StartTime,
            State,
          },
        },
      } = layers;

      // TODO: update this to support node input as props
      return merge(
        AccountID.update$,
        Balance.update$,
        HealthCurrent.update$,
        Location.update$,
        Rate.update$,
        StartTime.update$,
        State.update$,
        OperatorAddress.update$
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(layers, { kamis: true });

          // get the node through the location of the linked account
          const nodeEntityIndex = Array.from(
            runQuery([
              Has(IsNode),
              HasValue(Location, {
                value: account.location,
              }),
            ])
          )[0];
          const node =
            nodeEntityIndex !== undefined ? getNode(layers, nodeEntityIndex) : ({} as Node);

          // get the selected Node

          /////////////////
          // DEPENDENT DATA

          // get the productions on this node
          let nodeKamis: Kami[] = [];
          let nodeKamisMine: Kami[] = [];
          let nodeKamisOthers: Kami[] = [];
          if (node) {
            // populate the account Kamis
            const nodeProductionIndices = Array.from(
              runQuery([
                Has(IsProduction),
                HasValue(NodeID, { value: node.id }),
                HasValue(State, { value: 'ACTIVE' }),
              ])
            );

            for (let i = 0; i < nodeProductionIndices.length; i++) {
              const productionIndex = nodeProductionIndices[i];

              // kami:production is 1:1, so we're guaranteed to find one here
              const kamiID = getComponentValue(PetID, productionIndex)?.value as EntityID;
              const kamiIndex = world.entityToIndex.get(kamiID);
              nodeKamis.push(getKami(
                layers,
                kamiIndex!,
                { account: true, production: true, traits: true }
              ));
            }

            // split node kamis between mine and others
            if (nodeKamis) {
              const activeMine = nodeKamis.filter((kami) => {
                return kami.account!.id === account.id;
              });
              const activeOthers = nodeKamis.filter((kami) => {
                return kami.account!.id !== account.id;
              });
              nodeKamisMine = activeMine;
              nodeKamisOthers = activeOthers;
            }
          }

          return {
            actions,
            api: player,
            data: {
              account,
              liquidationConfig: getLiquidationConfig(layers.network),
              node: {
                ...node,
                kamis: {
                  allies: nodeKamisMine,
                  enemies: nodeKamisOthers,
                },
              },
            },
          };
        })
      );
    },

    // Render
    ({ actions, api, data }) => {
      // console.log('NodeM: data', data);
      const [tab, setTab] = useState('allies');
      const [lastRefresh, setLastRefresh] = useState(Date.now());
      const scrollableRef = useRef<HTMLDivElement>(null);
      const [scrollPosition, setScrollPosition] = useState<number>(0);

      /////////////////
      // TRACKING

      // scrolling
      useEffect(() => {
        const handleScroll = () => {
          if (scrollableRef.current) {
            setScrollPosition(scrollableRef.current.scrollTop);
          }
        };
        if (scrollableRef.current) {
          scrollableRef.current.addEventListener('scroll', handleScroll);
        }
        return () => {
          if (scrollableRef.current) {
            scrollableRef.current.removeEventListener('scroll', handleScroll);
          }
        };
      }, []);

      // ticking
      useEffect(() => {
        const refreshClock = () => {
          setLastRefresh(Date.now());
        };
        const timerId = setInterval(refreshClock, 1000);
        return function cleanup() {
          clearInterval(timerId);
        };
      }, []);


      ///////////////////
      // ACTIONS

      // collects on an existing production
      const collect = (kami: Kami) => {
        const actionID = `Collecting Harvest for ${kami.name}` as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          // on: data.????,
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.production.collect(kami.production!.id);
          },
        });
      };

      // liquidate a production
      // assume this function is only called with two kamis that have productions
      const liquidate = (myKami: Kami, enemyKami: Kami) => {
        const actionID = `Liquidating ${enemyKami.name}` as EntityID; // itemIndex should be replaced with the item's name
        actions.add({
          id: actionID,
          components: {},
          // on: data.account.index, // what's the appropriate value here?
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
        actions.add({
          id: actionID,
          components: {},
          // on: data.????,
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
        actions.add({
          id: actionID,
          components: {},
          // on: data.????,
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.production.stop(kami.production!.id);
          },
        });
      };


      /////////////////
      // INTERPRETATION

      // calculate the time a kami has spent idle (in seconds)
      const calcIdleTime = (kami: Kami): number => {
        return lastRefresh / 1000 - kami.lastUpdated;
      };

      // determine whether the kami is still on cooldown
      const onCooldown = (kami: Kami): boolean => {
        return calcIdleTime(kami) < kami.cooldown;
      };

      const isResting = (kami: Kami): boolean => {
        return kami.state === 'RESTING';
      };

      const getKamiOptions = (kamis: Kami[]): Kami[] => {
        return kamis.filter((kami) => isResting(kami) && !onCooldown(kami));
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
              node={data.node}
              availableKamis={getKamiOptions(data.account.kamis || [])}
              addKami={(kami) => start(kami, data.node)}
            />,
            <Tabs key='tabs' tab={tab} setTab={setTab} />
          ]}
          canExit
        >
          <Kards
            allies={data.node.kamis.allies}
            enemies={data.node.kamis.enemies}
            actions={{ collect, stop, liquidate }}
            liquidationConfig={data.liquidationConfig}
            tab={tab}
          />
        </ModalWrapperFull>
      );
    }
  );
}
