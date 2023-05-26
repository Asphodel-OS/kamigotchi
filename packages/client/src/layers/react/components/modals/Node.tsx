import React, { useEffect, useRef, useState, useCallback } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { registerUIComponent } from 'layers/react/engine/store';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import {
  ActionListButton,
  Option as ActionListOption,
} from 'layers/react/components/library/ActionListButton';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Account, getAccount } from 'layers/react/components/shapes/Account';
import { Kami, getKami } from 'layers/react/components/shapes/Kami';
import { Node, getNode } from 'layers/react/components/shapes/Node';
import { Production, getProduction } from 'layers/react/components/shapes/Production';
import { KamiCard } from '../library/KamiCard';
import { BatteryComponent } from '../library/Battery';
import { NodeInfo } from '../library/NodeContainer';
import { dataStore } from 'layers/react/store/createStore';

// merchant window with listings. assumes at most 1 merchant per room
export function registerNodeModal() {
  registerUIComponent(
    'NodeModal',

    // Grid Config
    {
      colStart: 34,
      colEnd: 68,
      rowStart: 9,
      rowEnd: 99,
    },

    // Requirement (Data Manangement)
    (layers) => {
      const {
        network: {
          world,
          actions,
          api: { player },
          network,
          components: {
            AccountID,
            NodeID,
            PetID,
            IsAccount,
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
        HealthCurrent.update$,
        Location.update$,
        Rate.update$,
        StartTime.update$,
        State.update$,
        OperatorAddress.update$
      ).pipe(
        map(() => {
          /////////////////
          // ROOT DATA

          // get the account through the account entity of the controlling wallet
          const accountIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(OperatorAddress, {
                value: network.connectedAddress.get(),
              }),
            ])
          )[0];
          const account =
            accountIndex !== undefined ? getAccount(layers, accountIndex) : ({} as Account);

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

          // get the resting kamis on this account
          let restingKamis: Kami[] = [];
          if (account) {
            const accountKamiIndices = Array.from(
              runQuery([
                Has(IsPet),
                HasValue(AccountID, { value: account.id }),
                HasValue(State, { value: 'RESTING' }),
              ])
            );

            restingKamis = accountKamiIndices.map((kamiIndex) => {
              return getKami(layers, kamiIndex);
            });
          }

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
              nodeKamis.push(getKami(layers, kamiIndex!, { account: true, production: true }));
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
              account: { ...account, kamis: restingKamis },
              node: {
                ...node,
                kamis: {
                  mine: nodeKamisMine,
                  others: nodeKamisOthers,
                },
              },
            } as any,
          };
        })
      );
    },

    // Render
    ({ actions, api, data }) => {
      // console.log('data', data);

      /////////////////
      // STATE TRACKING

      const scrollableRef = useRef<HTMLDivElement>(null);
      const [scrollPosition, setScrollPosition] = useState<number>(0);
      const [lastRefresh, setLastRefresh] = useState(Date.now());
      const [tab, setTab] = useState<'mine' | 'others'>('mine');
      const { visibleModals, setVisibleModals } = dataStore();
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
        const timerId = setInterval(refreshClock, 3000);
        return function cleanup() {
          clearInterval(timerId);
        };
      }, []);

      ///////////////////
      // ACTIONS

      // starts a production for the given pet and node
      const start = (kami: Kami, node: Node) => {
        const actionID = `Starting Harvest` as EntityID; // Date.now to have the actions ordered in the component browser
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

      /////////////////
      // DATA INTERPRETATION
      const RATE_PRECISION = 1e6;

      // rounds a value to a certain number of decimal places (precision)
      const roundTo = (value: number, precision: number) => {
        return Math.round(value * 10 ** precision) / 10 ** precision;
      };

      // get the health drain rate, based on the kami's production
      // this is based on a hardcoded value for the time being
      const calcDrainRate = (kami: Kami, precision?: number) => {
        const drainRate = calcProductionRate(kami) / 2.0;
        return precision == undefined ? drainRate : roundTo(drainRate, precision);
      };

      // get emission rate of the Kami's production. measured in (KAMI/s)
      const calcProductionRate = (kami: Kami, precision?: number) => {
        let rate = 0;
        if (isHarvesting(kami)) {
          rate = kami.production!.rate / RATE_PRECISION;
        }
        return precision == undefined ? rate : roundTo(rate, precision);
      };

      // calculate health based on the drain against last confirmed health
      const calcHealth = (kami: Kami, precision?: number) => {
        let health = kami.health;
        if (isHarvesting(kami)) {
          let duration = lastRefresh / 1000 - kami.lastUpdated;
          let drainRate = calcDrainRate(kami);
          let healthDrain = drainRate * duration;
          health -= healthDrain;
        }
        health = Math.max(health, 0);
        return precision == undefined ? health : roundTo(health, precision);
      };

      // calculate the expected output from a pet production based on starttime
      // set to N/A if dead
      const calcOutput = (kami: Kami, precision?: number) => {
        let output = 0;
        if (isHarvesting(kami) && !isDead(kami)) {
          let duration = lastRefresh / 1000 - kami.production!.startTime;
          output = Math.round(duration * calcProductionRate(kami));
        }
        return precision == undefined ? output : roundTo(output, precision);
      };

      // naive check right now, needs to be updated with murder check as well
      const isDead = (kami: Kami) => {
        return calcHealth(kami) == 0;
      };

      // check whether the kami is currently harvesting
      // TODO: replace this with a general state check
      const isHarvesting = (kami: Kami): boolean => {
        let result = false;
        if (kami.production) {
          result = kami.production.state === 'ACTIVE';
        }
        return result;
      };

      ///////////////////
      // DISPLAY

      // button for tabbing over to my Kamis
      const MyTabButton = () => (
        <ActionButton id={`my-tab`} onClick={() => setTab('mine')} text='Allies' />
      );

      // button for tabbing over to enemy Kamis
      const EnemyTabButton = () => (
        <ActionButton id={`enemy-tab`} onClick={() => setTab('others')} text='Enemies' />
      );

      // button for adding Kami to node
      const AddButton = (node: Node, restingKamis: Kami[]) => {
        const options: ActionListOption[] = restingKamis.map((kami) => {
          return { text: `${kami.name}`, onClick: () => start(kami, node) };
        });
        return (
          <ActionListButton
            id={`harvest-add`}
            key={`harvest-add`}
            text='Add Kami'
            hidden={true}
            scrollPosition={scrollPosition}
            options={options}
            disabled={restingKamis.length == 0}
          />
        );
      };

      // button for collecting on production
      const CollectButton = (myKami: Kami) => (
        <ActionButton
          id={`harvest-collect`}
          key={`harvest-collect`}
          onClick={() => collect(myKami.production!)}
          text='Collect'
        />
      );

      // button for stopping production
      const StopButton = (myKami: Kami) => (
        <ActionButton id={`harvest-stop`} onClick={() => stop(myKami.production!)} text='Stop' />
      );

      // button for liquidating production
      const LiquidateButton = (target: Kami, soldiers: Kami[]) => {
        const options: ActionListOption[] = soldiers.map((myKami) => {
          return { text: `${myKami.name}`, onClick: () => liquidate(myKami, target) };
        });

        return (
          <ActionListButton
            id={`liquidate-button-${target.index}`}
            key={`harvest-liquidate`}
            text='Liquidate'
            hidden={true}
            scrollPosition={scrollPosition}
            options={options}
            disabled={soldiers.length == 0}
          />
        );
      };

      // rendering of my kami on this node
      const MyKard = (kami: Kami) => {
        const health = calcHealth(kami, 0);
        const healthPercent = Math.round((health / kami.stats.health) * 100);
        const output = calcOutput(kami);

        const description = [
          '',
          `Health: ${health}/${kami.stats.health * 1}`, // multiply by 1 to interpret hex
          `Harmony: ${kami.stats.harmony * 1}`,
          `Violence: ${kami.stats.violence * 1}`,
        ];

        return (
          <KamiCard
            key={kami.id}
            title={kami.name}
            image={kami.uri}
            subtext={`yours (\$${output})`}
            action={[CollectButton(kami), StopButton(kami)]}
            cornerContent={<BatteryComponent level={healthPercent} />}
            description={description}
          />
        );
      };

      // rendering of enemy kami on this node
      const EnemyKard = (kami: Kami, myKamis: Kami[]) => {
        const health = calcHealth(kami, 0);
        const healthPercent = Math.round((health / kami.stats.health) * 100);
        const output = calcOutput(kami);

        const description = [
          '',
          `Health: ${health}/${kami.stats.health * 1}`, // multiply by 1 to interpret hex
          `Harmony: ${kami.stats.harmony * 1}`,
          `Violence: ${kami.stats.violence * 1}`,
        ];

        return (
          <KamiCard
            key={kami.id}
            title={kami.name}
            image={kami.uri}
            subtext={`${kami.account!.name} (\$${output})`}
            action={LiquidateButton(kami, myKamis)}
            cornerContent={<BatteryComponent level={healthPercent} />}
            description={description}
          />
        );
      };

      // the rendering of all my kamis on this node
      const MyKards = (myKamis: Kami[]) => {
        let kardList = myKamis.map((kami: Kami) => MyKard(kami));
        kardList.push(<Underline key='separator' />);
        kardList.push(AddButton(data.node, data.account.kamis));
        return kardList;
      };

      // the rendering of all enemy kamis on this node
      const EnemyKards = (enemies: Kami[], myKamis: Kami[]) => {
        return enemies.map((enemyKami: Kami) => EnemyKard(enemyKami, myKamis));
      };

      const hideModal = useCallback(() => {
        setVisibleModals({ ...visibleModals, node: false });
      }, [setVisibleModals, visibleModals]);

      if (data.account.kamis.length < 1) {
        return (
          <ModalWrapperFull id='node' divName='node'>
            <AlignRight>
              <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
                X
              </TopButton>
            </AlignRight>
            <Header>Nodes reject those who do not travel with Kamigotchi.</Header>
          </ModalWrapperFull>
        );
      }
      if (data.node.id) {
        return (
          <ModalWrapperFull id='node' divName='node'>
            <NodeInfo key={'node-info'} node={data.node} />
            {MyTabButton()}
            {EnemyTabButton()}
            <Scrollable ref={scrollableRef}>
              {tab === 'mine'
                ? MyKards(data.node.kamis.mine)
                : EnemyKards(data.node.kamis.others, data.node.kamis.mine)}
            </Scrollable>
          </ModalWrapperFull>
        );
      }
    }
  );
}

const Scrollable = styled.div`
  overflow-y: scroll;
  max-height: 100%;
`;

const Underline = styled.div`
  width: 90%;
  margin: 3% auto;
  border-bottom: 2px solid silver;
  font-weight: bold;
`;

const TopButton = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 5px;
  font-size: 14px;
  cursor: pointer;
  pointer-events: auto;
  border-radius: 5px;
  font-family: Pixel;
  width: 30px;
  &:active {
    background-color: #c4c4c4;
  }
  margin: 0px;
`;

const Header = styled.p`
  font-size: 24px;
  color: #333;
  text-align: left;
  font-family: Pixel;
  margin: 5px;
`;

const AlignRight = styled.div`
  text-align: left;
  margin: 0px;
`;
