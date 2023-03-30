import React, { useEffect, useState } from 'react';
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
import { Account, getAccount } from 'layers/react/components/shapes/Account';
import { Kami, getKami } from 'layers/react/components/shapes/Kami';
import { Node, getNode } from 'layers/react/components/shapes/Node';
import { Production, getProduction } from 'layers/react/components/shapes/Production';
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
          actions,
          api: { player },
          network,
          components: {
            AccountID,
            NodeID,
            IsAccount,
            IsNode,
            IsPet,
            IsProduction,
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
              HasValue(OperatorAddress, { value: network.connectedAddress.get() }),
            ])
          )[0];

          const account = (accountIndex !== undefined)
            ? getAccount(layers, accountIndex)
            : {} as Account;

          // get the node through the location of the linked account
          const nodeIndex = Array.from(
            runQuery([
              Has(IsNode),
              HasValue(Location, { value: account.location }),
            ])
          )[0];

          const node = (nodeIndex !== undefined)
            ? getNode(layers, nodeIndex)
            : {} as Node;



          /////////////////
          // DEPENDENT DATA

          // get the kamis on this account
          let accountKamis: Kami[] = [];
          if (account && node) {
            const accountKamiIndices = Array.from(
              runQuery([
                Has(IsPet),
                HasValue(AccountID, { value: account.id }),
              ])
            );

            // get all kamis on the node
            for (let i = 0; i < accountKamiIndices.length; i++) {
              accountKamis.push(getKami(
                layers,
                accountKamiIndices[i],
                { production: true, stats: true },
              ));
            }

            // filter by the kamis with active productions on the current node
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
          let nodeProductions: Production[] = [];
          if (node) {
            // populate the account Kamis
            const nodeProductionIndices = Array.from(
              runQuery([Has(IsProduction), HasValue(NodeID, { value: node.id })])
            );
            for (let i = 0; i < nodeProductionIndices.length; i++) {
              nodeProductions.push(getProduction(
                layers,
                nodeProductionIndices[i],
                { kami: true },
              ));
            }
          }

          return {
            actions,
            api: player,
            data: {
              account: { ...account, kamis: accountKamis }, // account => kami[] => production
              node: { ...node, productions: nodeProductions }, // node => production[] => kami
            } as any,
          };
        })
      );
    },

    // Render
    ({
      actions,
      api,
      data: {
        account: { kamis },
        node,
      },
      data,
    }) => {
      const [lastRefresh, setLastRefresh] = useState(Date.now());
      /////////////////
      // TICKING

      function refreshClock() {
        setLastRefresh(Date.now());
      }

      useEffect(() => {
        const timerId = setInterval(refreshClock, 1000);
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

      // get the health drain rate, based on the kami's production
      // this is based on a hardcoded value for the time being
      const calcDrainRate = (kami: Kami) => {
        return calcProductionRate(kami) / 2.0;
      }

      // get emission rate of the Kami's production. measured in (KAMI/s)
      const calcProductionRate = (kami: Kami) => {
        let rate = 0;
        if (isHarvesting(kami)) {
          rate = kami.production!.rate / RATE_PRECISION;
        }
        return rate;
      }

      // calculate health based on the drain against last confirmed health
      const calcHealth = (kami: Kami) => {
        let health = kami.health;

        // calculate the health drain on the kami since the last health update
        if (isHarvesting(kami)) {
          let duration = lastRefresh / 1000 - kami.lastUpdated;
          let drainRate = calcDrainRate(kami);
          let healthDrain = drainRate * duration;
          health -= healthDrain;
        }
        return Math.max(health, 0);
      }

      // calculate the expected output from a pet production based on starttime
      // set to N/A if dead
      const calcOutput = (kami: Kami) => {
        let output = 0;
        if (isHarvesting(kami) && !isDead(kami)) {
          let duration = lastRefresh / 1000 - kami.production!.startTime;
          output = Math.round(duration * calcProductionRate(kami));
        }
        return Math.max(output, 0);
      }

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

      // rendering of my kami on this node
      // NOTE: the smart contract does not currently gate multiple kamis being
      // on the same node. The above data population just grabs the first one.
      const MyKami = (kami: Kami) => {
        const health = calcHealth(kami);
        const harvestRate = calcProductionRate(kami) * 3600;

        const description = [
          '',
          `Health: ${health.toFixed(1)}/${kami.stats!.health * 1}`, // multiply by 1 to interpret hex
          `Violence: ${kami.stats!.violence * 1}`,
          `$KAMI: ${calcOutput(kami)} (${harvestRate.toFixed(1)}/hr)`,
        ];

        return (
          <KamiCard
            key={kami.id}
            title={kami.name}
            image={kami.uri}
            subtext={'yours'}
            action={[CollectButton(kami), StopButton(kami)]}
            cornerContent={<Battery percentage={100} />}
            description={description}
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
        return (<p>{node?.name}</p>);
      };

      return (
        <ModalWrapperFull id="node" divName="node">
          {NodeInfo(data.node)}
          {data.account.kamis.map((kami: Kami) => MyKami(kami))}
          <Underline />
          <Scrollable></Scrollable>
        </ModalWrapperFull>
      );
    }
  );
}

const Scrollable = styled.div`
  overflow: auto;
  max-height: 100%;
`;

const Underline = styled.div`
  width: 80%;
  margin-top: 5%;
  margin: 0 auto;
  border-bottom: 2px solid silver;
  font-weight: bold;
`;
