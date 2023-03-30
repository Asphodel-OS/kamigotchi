import React, { useState, useEffect } from 'react';
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

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { KamiCard } from 'layers/react/components/library/KamiCard';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Account, getAccount } from 'layers/react/components/shapes/Account';
import { Kami, getKami } from 'layers/react/components/shapes/Kami';
import { registerUIComponent } from 'layers/react/engine/store';
import 'layers/react/styles/font.css';

import pompom from 'assets/images/food/pompom.png';
import gakki from 'assets/images/food/gakki.png';
import gum from 'assets/images/food/gum.png';

const ItemImages = new Map([
  [1, gum],
  [2, pompom],
  [3, gakki],
]);

const ItemNames = new Map([
  [1, 'Gum'],
  [2, 'Pompom'],
  [3, 'Gakki'],
]);

export function registerPartyModal() {
  registerUIComponent(
    'PetList',
    {
      colStart: 3,
      colEnd: 33,
      rowStart: 2,
      rowEnd: 35,
    },

    // Requirement (Data Manangement)
    (layers) => {
      const {
        network: {
          world,
          api: { player },
          network,
          components: {
            AccountID,
            Balance,
            Health,
            HealthCurrent,
            Coin,
            Power,
            HolderID,
            IsAccount,
            IsInventory,
            IsNode,
            IsProduction,
            IsPet,
            ItemIndex,
            LastActionTime,
            Location,
            MediaURI,
            Name,
            NodeID,
            OperatorAddress,
            OwnerID,
            PetID,
            PetIndex,
            Rate,
            State,
            StartTime,
          },
          actions,
        },
      } = layers;

      // aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      // aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      // aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      const hardCodeInventory = () => {
        return [
          {
            id: 1,
            itemIndex: 1,
            image: gum,
            balance: 0,
          },
          {
            id: 2,
            itemIndex: 2,
            image: pompom,
            balance: 0,
          },
          {
            id: 3,
            itemIndex: 3,
            image: gakki,
            balance: 0,
          },
        ];
      };

      // get an Inventory object by index
      // TODO: get name and decription here once we have item registry support
      // NOTE: we need to do something about th FE/SC side overloading the term 'index'
      const getInventory = (index: EntityIndex) => {
        const itemIndex = getComponentValue(ItemIndex, index)?.value as number;
        return {
          id: world.entities[index],
          item: {
            index: itemIndex, // this is the solecs index rather than the cached index
            // name: getComponentValue(Name, itemIndex)?.value as string,
            // description: ???, // are we intending to save this onchain or on FE?
          },
          balance: getComponentValue(Balance, index)?.value as number,
        };
      };

      // this is about to be the jankiest bit inventory retrieval we will see..
      const getConsumables = (accountIndex: EntityIndex) => {
        // pompom
        // gakki
        // ribbon
        // gum
      };

      // gets a Production object from an index
      const getProduction = (index: EntityIndex) => {
        return {
          id: world.entities[index],
          nodeId: getComponentValue(NodeID, index)?.value as string,
          state: getComponentValue(State, index)?.value as string,
          startTime: getComponentValue(StartTime, index)?.value as number,
        };
      };

      return merge(
        AccountID.update$,
        Balance.update$,
        Coin.update$,
        HealthCurrent.update$,
        Location.update$,
        OwnerID.update$,
        Rate.update$,
        State.update$,
        StartTime.update$,
        MediaURI.update$
      ).pipe(
        map(() => {
          // get the account entity of the controlling wallet
          const accountEntityIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(OperatorAddress, {
                value: network.connectedAddress.get(),
              }),
            ])
          )[0];
          const accountID = world.entities[accountEntityIndex];
          const bytes = getComponentValue(Coin, accountEntityIndex)
            ?.value as number;

          // get the list of inventory indices for this account
          const inventoryResults = Array.from(
            runQuery([
              Has(IsInventory),
              HasValue(HolderID, { value: accountID }),
            ])
          );
          let inventories: any = hardCodeInventory(); // the hardcoded slots we want for consumables

          // if we have inventories for the account, generate a list of inventory objects
          let itemIndex;
          for (let i = 0; i < inventoryResults.length; i++) {
            // match indices to the existing consumables
            itemIndex = getComponentValue(ItemIndex, inventoryResults[i])
              ?.value as number;
            for (let j = 0; j < inventories.length; j++) {
              if (inventories[j].itemIndex == itemIndex) {
                let balance = getComponentValue(Balance, inventoryResults[j])
                  ?.value as number;
                inventories[j].balance = balance ? balance * 1 : 0;
              }
            }
          }

          // get all indices of pets linked to this account and create object array
          let pets: any = [];
          let kamis: Kami[] = [];
          const petResults = Array.from(
            runQuery([Has(IsPet), HasValue(AccountID, { value: accountID })])
          );
          for (let i = 0; i < petResults.length; i++) {
            kamis.push(getKami(layers, petResults[i], { production: true, stats: true }));
          }

          // get the node of the current room for starting productions
          let nodeID;
          let location = getComponentValue(Location, accountEntityIndex)
            ?.value as number;
          const nodeResults = Array.from(
            runQuery([Has(IsNode), HasValue(Location, { value: location })])
          );
          if (nodeResults.length > 0) {
            nodeID = world.entities[nodeResults[0]];
          }

          return {
            actions,
            api: player,
            data: {
              account: {
                id: accountID,
                inventories,
                bytes,
                kamis,
              },
              pets,
              node: { id: nodeID },
            } as any,
          };
        })
      );
    },

    // Render
    ({ actions, api, data }) => {
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

      /////////////////
      // INTERACTIONS

      // starts a production for the given pet on the node in the room
      const startProduction = (petID: EntityID) => {
        const actionID = `Starting Harvest` as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          // on: data.????,
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.production.start(petID, data.node.id);
          },
        });
      };

      // stops a production
      const stopProduction = (productionID: EntityID) => {
        const actionID = `Stopping Harvest` as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          // on: data.????,
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.production.stop(productionID);
          },
        });
      };

      // collects on an existing production
      const reapProduction = (productionID: EntityID) => {
        const actionID = `Collecting Harvest` as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          // on: data.????,
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.production.collect(productionID);
          },
        });
      };

      // feed pet, no inventory check
      const feed = (petID: EntityID, food: number) => {
        const actionID = `Feeding Kami` as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          // on: data.????,
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.food.feed(petID, food);
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

      // get the title of the kami as 'name (health / totHealth)'
      const getTitle = (kami: Kami) => {
        const health = calcHealth(kami);
        return kami.name + ` (${health.toFixed()}/${kami.stats!.health * 1})`;
      };

      // get the description of the kami as a list of lines
      // TODO: clean this up
      const getDescription = (kami: Kami): string[] => {
        let description: string[];

        if (isHarvesting(kami)) {
          if (!isDead(kami)) {
            const harvestRate = calcProductionRate(kami) * 3600; //hourly
            const drainRate = calcDrainRate(kami) * 3600; //hourly
            description = [
              `Harvesting on ${kami.production!.node!.name}`,
              `+${harvestRate.toFixed(1)} $KAMI/hr`,
              `-${drainRate.toFixed(1)} HP/hr`,
            ];
          } else {
            description = ['died (of neglect)'];
          }
        } else {
          if (isDead(kami)) {
            description = [`Murdered by ???`];
          } else {
            description = ['chillin'];
          }
        }
        return description;
      };

      /////////////////
      // DISPLAY

      // get the row of consumable items to display in the player inventory
      // NOTE: does not render until player inventories are populated
      const ConsumableCells = (inventories: any[]) => {
        return inventories.map((inv) => {
          return (
            <CellBordered key={inv.id} style={{ gridColumn: `${inv.id}` }}>
              <CellGrid>
                <Icon src={inv.image} />
                <ItemNumber>{inv.balance ?? 0}</ItemNumber>
              </CellGrid>
            </CellBordered>
          );
        });
      };

      const CollectButton = (kami: any) => (
        <ActionButton
          id={`harvest-collect`}
          onClick={() => reapProduction(kami.production.id)}
          text="Collect"
        />
      );

      const FeedButton = (kami: any, foodIndex: number) => (
        <ActionButton
          id={`feed-${foodIndex}`}
          onClick={() => feed(kami.id, foodIndex)}
          text={`Feed ${foodIndex}`}
        />
      );

      const StartButton = (kami: any) => (
        <ActionButton
          id={`harvest-start`}
          onClick={() => startProduction(kami.id)}
          text="Start"
        />
      );

      const StopButton = (kami: any) => (
        <ActionButton
          id={`harvest-stop`}
          onClick={() => stopProduction(kami.production.id)}
          text="Stop"
        />
      );

      const KamiCards = (kamis: any[]) => {
        return kamis.map((kami) => {
          const title = getTitle(kami);
          const description = getDescription(kami);
          const action = isHarvesting(kami)
            ? StopButton(kami)
            : StartButton(kami);

          return (
            <KamiCard
              key={kami.id}
              title={title}
              image={kami.uri}
              subtext={`+${calcOutput(kami)} $KAMI`}
              action={action}
              cornerContent={FeedButton(kami, 1)}
              description={description}
            />
          );
        });
      };

      return (
        <ModalWrapperFull id="party_modal" divName="party" fill={true}>
          <TopGrid>
            <TopDescription>
              Bytes: {data.account.bytes ? data.account.bytes * 1 : '0'}
            </TopDescription>
          </TopGrid>
          <ConsumableGrid>
            {ConsumableCells(data.account.inventories)}
          </ConsumableGrid>
          <Scrollable>{KamiCards(data.account.kamis)}</Scrollable>
        </ModalWrapperFull>
      );
    }
  );
}

const Scrollable = styled.div`
  overflow: auto;
  max-height: 100%;
`;

const TopDescription = styled.p`
  font-size: 14px;
  color: #333;
  text-align: left;
  font-family: Pixel;
  grid-column: 1;
  align-self: center;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  border-radius: 5px;
  padding: 5px;
`;

const ConsumableGrid = styled.div`
  display: grid;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  border-radius: 5px;
  margin: 5px 2px 5px 2px;
`;

const TopGrid = styled.div`
  display: grid;
  margin: 2px;
`;

const CellGrid = styled.div`
  display: grid;
  border-style: solid;
  border-width: 0px;
  border-color: black;
`;

const CellBordered = styled.div`
  border-style: solid;
  border-width: 0px 2px 0px 0px;
  border-color: black;
`;

const Icon = styled.img`
  grid-column: 1;
  height: 40px;
  padding: 3px;
  border-style: solid;
  border-width: 0px 2px 0px 0px;
  border-color: black;
`;

const ItemNumber = styled.p`
  font-size: 14px;
  color: #333;
  font-family: Pixel;
  grid-column: 2;
  align-self: center;
`;
