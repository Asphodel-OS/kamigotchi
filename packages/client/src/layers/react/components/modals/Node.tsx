import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import {
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { registerUIComponent } from 'layers/react/engine/store';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Account, getAccount } from 'layers/react/components/shapes/Account';
import { Kami, getKami } from 'layers/react/components/shapes/Kami';
import { Node, getNode } from 'layers/react/components/shapes/Node';
import {
  Production,
  getProduction,
} from 'layers/react/components/shapes/Production';
import { KamiCard } from '../library/KamiCard';
import { BatteryComponent } from '../library/Battery';
import { NodeInfo } from '../library/NodeContainer';

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
        State.update$
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
            accountIndex !== undefined
              ? getAccount(layers, accountIndex)
              : ({} as Account);

          // get the node through the location of the linked account
          const nodeIndex = Array.from(
            runQuery([
              Has(IsNode),
              HasValue(Location, { value: account.location }),
            ])
          )[0];

          const node =
            nodeIndex !== undefined ? getNode(layers, nodeIndex) : ({} as Node);

          /////////////////
          // DEPENDENT DATA

          // get the kamis on this account
          let accountKamis: Kami[] = [];
          if (account && node) {
            const accountKamiIndices = Array.from(
              runQuery([Has(IsPet), HasValue(AccountID, { value: account.id })])
            );

            // get all kamis on the node
            for (let i = 0; i < accountKamiIndices.length; i++) {
              accountKamis.push(
                getKami(layers, accountKamiIndices[i], { production: true })
              );
            }

            // filter by the kamis with active productions on the current node
            // we can assume there is at most one
            if (accountKamis) {
              const kamisOnNode = accountKamis.filter((kami) => {
                if (!node) return false;

                if (kami.production && kami.production.state === 'ACTIVE') {
                  return kami.production.node!.id === node.id;
                }
              });
              accountKamis = kamisOnNode;
            }
          }

          // get the productions on this node
          let nodeKamis: Kami[] = [];
          if (node) {
            // populate the account Kamis
            const nodeProductionIndices = Array.from(
              runQuery([
                Has(IsProduction),
                HasValue(NodeID, { value: node.id }),
              ])
            );

            for (let i = 0; i < nodeProductionIndices.length; i++) {
              const productionIndex = nodeProductionIndices[i];

              // kami:production is 1:1, so we're guaranteed to find one here
              const kamiID = getComponentValue(PetID, productionIndex)
                ?.value as EntityID;
              const kamiIndex = world.entityToIndex.get(kamiID);
              nodeKamis.push(
                getKami(layers, kamiIndex!, { account: true, production: true })
              );
            }
          }

          return {
            actions,
            api: player,
            data: {
              account: { ...account, kamis: accountKamis }, // account => kami[] => production
              node: { ...node, kamis: nodeKamis }, // node => production[] => kami
            } as any,
          };
        })
      );
    },

    // Render
    ({ actions, api, data }) => {
      console.log('data', data);
      const [lastRefresh, setLastRefresh] = useState(Date.now());
      /////////////////
      // TICKING

      function refreshClock() {
        setLastRefresh(Date.now());
      }

      useEffect(() => {
        const timerId = setInterval(refreshClock, 2000);
        return function cleanup() {
          clearInterval(timerId);
        };
      }, []);

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
        return precision == undefined
          ? drainRate
          : roundTo(drainRate, precision);
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

      const calcHealthPercent = (kami: Kami, precision?: number) => {
        let healthPercent = 0;
        healthPercent = calcHealth(kami) / kami.stats.health;
        return precision == undefined
          ? healthPercent
          : roundTo(healthPercent, precision);
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

      // stop production action button
      const StopButton = (myKami: Kami) => (
        <ActionButton
          id={`harvest-stop`}
          onClick={() => stop(myKami.production!)}
          text="Stop"
        />
      );

      // liquidate production action button
      // TODO: update this to check if myKami is not empty. disable button if so
      const LiquidateButton = (myKami: Kami, enemyKami: Kami) => (
        <ActionButton
          id={`harvest-liquidate`}
          onClick={() => liquidate(enemyKami.production!, myKami)}
          text="liquidate"
        />
      );

      // rendering of my kami on this node
      // NOTE: the smart contract does not currently gate multiple kamis being
      // on the same node. The above data population just grabs the first one.
      const MyKamiCard = (kami: Kami) => {
        const health = calcHealth(kami, 0);
        const harvestRate = roundTo(calcProductionRate(kami) * 3600, 1);
        const healthPercent = Math.round((health / kami.stats.health) * 100);
        console.log(health);

        const description = [
          '',
          `Health: ${health}/${kami.stats.health * 1}`, // multiply by 1 to interpret hex
          `Violence: ${kami.stats.violence * 1}`,
          `$KAMI: ${calcOutput(kami)} (+${harvestRate.toFixed(1)}/hr)`,
        ];

        return (
          <KamiCard
            key={kami.id}
            title={kami.name}
            image={kami.uri}
            subtext={'yours'}
            action={StopButton(kami)}
            cornerContent={<BatteryComponent level={healthPercent} />}
            description={description}
          />
        );
      };

      // rendering of enemy kami (production) on this node
      const EnemyKamiCard = (kami: Kami, myKami: Kami) => {
        const health = calcHealth(kami, 0);
        const harvestRate = roundTo(calcProductionRate(kami) * 3600, 1);
        const healthPercent = Math.round((health / kami.stats.health) * 100);
        console.log(health);

        const description = [
          '',
          `Health: ${health}/${kami.stats.health * 1}`, // multiply by 1 to interpret hex
          `Harmony: ${kami.stats.harmony * 1}`,
          `$KAMI: ${calcOutput(kami)} (+${harvestRate.toFixed(1)}/hr)`,
        ];

        return (
          <KamiCard
            key={kami.id}
            title={kami.name}
            image={kami.uri}
            subtext={kami.account!.name}
            action={LiquidateButton(kami, myKami)}
            cornerContent={<BatteryComponent level={healthPercent} />}
            description={description}
          />
        );
      };

      // the rendering of all the enemy kamis on this node
      // may be easier/better to pass in the list of Productions instead
      const EnemyProductions = (kamis: Kami[], myKami: Kami) => {
        return kamis.map((kami: Kami) => EnemyKamiCard(kami, myKami));
      };

      if (data.node.id) {
        return (
          <ModalWrapperFull id="node" divName="node" fill={true}>
            {<NodeInfo node={data.node} />}
            <WrappedKamis>
              {data.account.kamis.map((kami: Kami) => MyKamiCard(kami))}
            </WrappedKamis>
            <Underline />
            <Scrollable>
              <WrappedKamis>
                {EnemyProductions(data.node.kamis, data.account.kamis[0])}
              </WrappedKamis>
            </Scrollable>
          </ModalWrapperFull>
        );
      } else {
        return (
          <ModalWrapperFull id="node" divName="node">
            <Underline />
            there are no kami here
          </ModalWrapperFull>
        );
      }
    }
  );
}

const Scrollable = styled.div`
  overflow: auto;
  max-height: 100%;
`;

const Underline = styled.div`
  width: 90%;
  margin: 3% auto;
  border-bottom: 2px solid silver;
  font-weight: bold;
`;

const WrappedKamis = styled.div`
  display: 'flex';
  flex-direction: column;
  margin: 10px;
`;
