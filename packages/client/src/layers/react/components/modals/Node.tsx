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
import { Battery } from 'layers/react/components/library/Battery';
import { Countdown } from 'layers/react/components/library/Countdown';
import { KamiCard2 } from 'layers/react/components/library/KamiCard2';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { NodeHeader } from 'layers/react/components/library/NodeHeader';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { registerUIComponent } from 'layers/react/engine/store';
import { Account, getAccount } from 'layers/react/shapes/Account';
import { Kami, getKami } from 'layers/react/shapes/Kami';
import { getLiquidationConfig } from 'layers/react/shapes/LiquidationConfig';
import { Node, NodeKamis, getNode } from 'layers/react/shapes/Node';


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
          network,
          components: {
            AccountID,
            Balance,
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
        Balance.update$,
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
              account: { ...account, kamis: restingKamis },
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

      /////////////////
      // STATE TRACKING

      const scrollableRef = useRef<HTMLDivElement>(null);
      const [scrollPosition, setScrollPosition] = useState<number>(0);
      const [lastRefresh, setLastRefresh] = useState(Date.now());
      const [tab, setTab] = useState<'allies' | 'enemies'>('allies');

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

      // collects on all eligible productions on a node
      const collectAll = (node: Node) => {
        const actionID = `Collecting All Harvests` as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          // on: data.????,
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.node.collect(node.id);
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
      // DATA INTERPRETATION

      // calculate health based on the drain against last confirmed health
      const calcHealth = (kami: Kami): number => {
        let health = 1 * kami.health;
        let duration = calcIdleTime(kami);
        health += kami.healthRate * duration;
        health = Math.min(Math.max(health, 0), kami.stats.health);
        return health;
      };

      // calculate the time a kami has spent idle (in seconds)
      const calcIdleTime = (kami: Kami): number => {
        return lastRefresh / 1000 - kami.lastUpdated;
      };

      // calculate the expected output from a pet production based on starttime
      const calcOutput = (kami: Kami): number => {
        let output = 0;
        if (isHarvesting(kami) && kami.production) {
          output = kami.production.balance * 1;
          let duration = lastRefresh / 1000 - kami.production.startTime;
          output += Math.floor(duration * kami.production?.rate);
        }
        return Math.max(output, 0);
      };

      const calcLiquidationAffinityMultiplier = (attacker: Kami, victim: Kami): number => {
        const multiplierBase = data.liquidationConfig.multipliers.affinity.base;
        const multiplierUp = data.liquidationConfig.multipliers.affinity.up;
        const multiplierDown = data.liquidationConfig.multipliers.affinity.down;

        let multiplier = multiplierBase;
        if (attacker.traits && victim.traits) {
          const attackerAffinity = attacker.traits.hand.affinity;
          const victimAffinity = victim.traits.body.affinity;
          if (attackerAffinity === 'EERIE') {
            if (victimAffinity === 'SCRAP') multiplier = multiplierUp;
            else if (victimAffinity === 'INSECT') multiplier = multiplierDown;
          } else if (attackerAffinity === 'SCRAP') {
            if (victimAffinity === 'INSECT') multiplier = multiplierUp;
            else if (victimAffinity === 'EERIE') multiplier = multiplierDown;
          } else if (attackerAffinity === 'INSECT') {
            if (victimAffinity === 'EERIE') multiplier = multiplierUp;
            else if (victimAffinity === 'SCRAP') multiplier = multiplierDown;
          }
        }
        return multiplier;
      };

      // calculate the base liquidation threshold b/w two kamis as a %
      const calcLiquidationThresholdBase = (attacker: Kami, victim: Kami): number => {
        const ratio = attacker.stats.violence / victim.stats.harmony;
        const weight = cdf(Math.log(ratio), 0, 1);
        const peakBaseThreshold = data.liquidationConfig.threshold;
        return weight * peakBaseThreshold;
      };

      // calculate the liquidation threshold b/w two kamis as a %
      const calcLiquidationThreshold = (attacker: Kami, victim: Kami): number => {
        const base = calcLiquidationThresholdBase(attacker, victim);
        const multiplier = calcLiquidationAffinityMultiplier(attacker, victim);
        return base * multiplier;
      };

      // determine if pet is healthy (currHealth > 0)
      const isHealthy = (kami: Kami): boolean => {
        return calcHealth(kami) > 0;
      };

      // determine whether the kami is still on cooldown
      const onCooldown = (kami: Kami): boolean => {
        return calcIdleTime(kami) < kami.cooldown;
      };

      // determine whether a kami can liquidate another kami
      const canLiquidate = (attacker: Kami, victim: Kami): boolean => {
        const thresholdPercent = calcLiquidationThreshold(attacker, victim);
        const absoluteThreshold = thresholdPercent * victim.stats.health;
        const canMog = calcHealth(victim) < absoluteThreshold;
        return !onCooldown(attacker) && isHealthy(attacker) && canMog;
      }

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

      // derive disabled text for allied kami (return '' if not disabled)
      const getDisabledText = (kami: Kami): string => {
        let disabledText = '';
        if (onCooldown(kami)) {
          const cooldown = kami.cooldown - calcIdleTime(kami)
          disabledText = 'On cooldown (' + cooldown.toFixed(0) + 's left)';
        } else if (!isHealthy(kami)) {
          disabledText = 'Kami is starving!';
        }
        return disabledText;
      }

      // button for adding Kami to node
      const AddButton = (node: Node, kamis: Kami[]) => {
        const availableKamis = kamis.filter((kami) => !onCooldown(kami));
        const options: ActionListOption[] = availableKamis.map((kami) => {
          return { text: `${kami.name}`, onClick: () => start(kami, node) };
        });
        return (
          <ActionListButton
            id={`harvest-add`}
            key={`harvest-add`}
            text='Add Kami'
            scrollPosition={scrollPosition}
            options={options}
            disabled={kamis.length == 0}
          />
        );
      };

      // button for collecting on production
      const CollectButton = (kami: Kami) => {
        let tooltipText = getDisabledText(kami);

        return (
          <Tooltip text={[tooltipText]}>
            <ActionButton
              id={`harvest-collect-${kami.index}`}
              key={`harvest-collect-${kami.index}`}
              onClick={() => collect(kami)}
              text='Collect'
              disabled={kami.production === undefined || tooltipText !== ''}
            />
          </Tooltip>
        );
      }

      const CollectAllButton = (node: Node, allies: Kami[]) => (
        <ActionButton
          id={`harvest-collect-all`}
          key={`harvest-collect-all`}
          onClick={() => collectAll(node)}
          text='Collect All'
          disabled={allies.length == 0}
        />
      );

      // button for stopping production
      const StopButton = (kami: Kami) => {
        let tooltipText = getDisabledText(kami);
        return (
          <Tooltip text={[tooltipText]}>
            <ActionButton
              id={`harvest-stop-${kami.index}`}
              key={`harvest-stop-${kami.index}`}
              text='Stop'
              onClick={() => stop(kami)}
              disabled={kami.production === undefined || tooltipText !== ''}
            />
          </Tooltip >
        );
      }

      // button for liquidating production
      const LiquidateButton = (target: Kami, allies: Kami[]) => {
        const options: ActionListOption[] = allies.map((myKami) => {
          return { text: `${myKami.name}`, onClick: () => liquidate(myKami, target) };
        });

        return (
          <ActionListButton
            id={`liquidate-button-${target.index}`}
            key={`harvest-liquidate`}
            text='Liquidate'
            scrollPosition={scrollPosition}
            options={options}
            disabled={allies.length == 0}
          />
        );
      };

      // includes the Health Battery and Cooldown Clock
      const CornerContent = (kami: Kami) => {
        const health = calcHealth(kami);
        const healthPercent = Math.round((health / kami.stats.health) * 100);
        const cooldown = Math.round(Math.max(kami.cooldown - calcIdleTime(kami), 0));
        const cooldownString = `Cooldown: ${Math.max(cooldown, 0).toFixed(0)}s`;
        return (
          <>
            <Tooltip text={[cooldownString]}>
              <Countdown total={kami.cooldown} current={cooldown} />
            </Tooltip>
            <Tooltip text={[`${healthPercent}%`]}>
              <Battery level={100 * calcHealth(kami) / kami.stats.health} />
            </Tooltip>
          </>
        );
      };

      // rendering of an ally kami on this node
      const MyKard = (kami: Kami) => {
        const health = calcHealth(kami);
        const output = calcOutput(kami);

        const description = [
          '',
          `Health: ${health.toFixed()}/${kami.stats.health * 1}`, // multiply by 1 to interpret hex
          `Harmony: ${kami.stats.harmony * 1}`,
          `Violence: ${kami.stats.violence * 1}`,
        ];

        return (
          <KamiCard2
            key={kami.index}
            kami={kami}
            subtext={`yours (\$${output})`}
            action={[CollectButton(kami), StopButton(kami)]}
            cornerContent={CornerContent(kami)}
            description={description}
          />
        );
      };

      // rendering of an enemy kami on this node
      const EnemyKard = (kami: Kami, myKamis: Kami[]) => {
        const health = calcHealth(kami);
        const output = calcOutput(kami);

        const description = [
          '',
          `Health: ${health.toFixed()}/${kami.stats.health * 1}`, // multiply by 1 to interpret hex
          `Harmony: ${kami.stats.harmony * 1}`,
          `Violence: ${kami.stats.violence * 1}`,
        ];

        const validLiquidators = myKamis.filter((myKami) => {
          return canLiquidate(myKami, kami);
        });

        return (
          <KamiCard2
            key={kami.index}
            kami={kami}
            subtext={`${kami.account!.name} (\$${output})`}
            action={LiquidateButton(kami, validLiquidators)}
            cornerContent={CornerContent(kami)}
            description={description}
          />
        );
      };

      // list of kamis to display
      // chooses between allies and enemies depending on selected tab
      const KamiList = (nodeKamis: NodeKamis) => {
        const allies = nodeKamis.allies ?? [];
        const enemies = nodeKamis.enemies ?? [];

        return (
          <Scrollable ref={scrollableRef} style={{ flexGrow: 1 }}>
            {(tab === 'allies')
              ? allies.map((ally: Kami) => MyKard(ally))
              : enemies.map((enemy: Kami) => EnemyKard(enemy, allies))
            }
          </Scrollable>
        );
      };

      const KamiTabs = () => (
        <Tabs>
          <ActionButton
            id={`my-tab`}
            text='Allies'
            onClick={() => setTab('allies')}
            disabled={tab === 'allies'}
            fill={true}
          />
          <ActionButton
            id={`enemy-tab`}
            text='Enemies'
            onClick={() => setTab('enemies')}
            disabled={tab === 'enemies'}
            fill={true}
          />
        </Tabs>
      );

      return (
        <ModalWrapperFull
          id='node'
          divName='node'
          header={<NodeHeader node={data.node} />}
        >
          {KamiTabs()}
          {KamiList(data.node.kamis)}
          <Underline key='separator' />
          {(tab === 'allies') &&
            <NodeActions>
              {CollectAllButton(data.node, data.node.kamis.allies)}
              {AddButton(data.node, data.account.kamis)}
            </NodeActions>
          }
        </ModalWrapperFull>
      );
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

const Tabs = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
`;

const NodeActions = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;