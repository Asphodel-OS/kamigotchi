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

      // gets a Pet object from an index
      // TODO(ja): support names, equips, stats and production details
      const getPet = (index: EntityIndex) => {
        const id = world.entities[index];

        // get the pet's prodcution object if it exists
        let production;
        const productionResults = Array.from(
          runQuery([Has(IsProduction), HasValue(PetID, { value: id })])
        );
        if (productionResults.length > 0) {
          production = getProduction(productionResults[0]);
        }

        return {
          id,
          index: getComponentValue(PetIndex, index)?.value as string,
          name: getComponentValue(Name, index)?.value as string,
          uri: getComponentValue(MediaURI, index)?.value as string,
          power: getComponentValue(Power, index)?.value as number,
          health: getComponentValue(Health, index)?.value as number,
          currHealth: getComponentValue(HealthCurrent, index)?.value as number,
          lastHealthTime: getComponentValue(LastActionTime, index)
            ?.value as number,
          production,
        };
      };

      return merge(
        AccountID.update$,
        Balance.update$,
        Coin.update$,
        HealthCurrent.update$,
        Location.update$,
        OwnerID.update$,
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
          const petResults = Array.from(
            runQuery([Has(IsPet), HasValue(AccountID, { value: accountID })])
          );
          for (let i = 0; i < petResults.length; i++) {
            pets.push(getPet(petResults[i]));
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

      // get the production rate of the kami, only based on power right now
      const calcProductionRate = (kami: any) => {
        let rate = 0;
        if (kami.production && kami.production.state === 'ACTIVE') {
          rate = kami.power / 3600;
        }
        return rate;
      };

      // calculate health based on the drain against last confirmed health
      const calcHealth = (kami: any) => {
        // calculate the health drain on the kami since the last health update
        let duration = lastRefresh / 1000 - kami.lastHealthTime;
        let drainRate = calcProductionRate(kami) / 2;
        let healthDrain = drainRate * duration;

        return Math.max(kami.currHealth - healthDrain, 0);
      }

      // calculate the expected output from a pet production based on starttime
      // set to N/A if dead
      const calcOutput = (kami: any) => {
        if (isHarvesting(kami) && !isDead(kami)) {
          let duration = lastRefresh / 1000 - kami.production.startTime;
          let output = Math.round(duration * calcProductionRate(kami));
          return Math.max(output, 0);
        }
        return 0;
      };

      // naive check right now, needs to be updated with murder check as well
      const isDead = (kami: any) => {
        return calcHealth(kami) == 0;
      }

      // check whether the kami is currently harvesting
      // TODO: replace this with a general state check
      const isHarvesting = (kami: any): boolean => {
        return kami.production && kami.production.state === 'ACTIVE';
      };

      // get the title of the kami as 'name (health / totHealth)'
      const getTitle = (kami: any) => {
        const health = calcHealth(kami).toFixed();
        return kami.name + ` (${health}/${parseInt(kami.health)})`;
      }

      // get the description of the kami as a list of lines
      // TODO: clean this up
      const getDescription = (kami: any) => {
        let description: string[] = [];
        const health = calcHealth(kami);

        if (isHarvesting(kami)) {
          if (health == 0) {
            description.push('died (of neglect)')
          } else {
            description.push(`Harvesting on ${kami.production.nodeId.slice(0, 6)}`);
            description.push(`+${kami.power * 1} $KAMI/hr`);
            description.push(`-${kami.power / 2} HP/hr`);
          }
        } else {
          if (health == 0) {
            description.push(`Murdered on ${kami.production.nodeId.slice(0, 6)}`);
          } else {
            description.push('chillin');
          }
        }
        return description;
      }

      /////////////////
      // DISPLAY

      // get the row of consumable items to display in the player inventory
      // NOTE: does not render until player inventories are populated
      const ConsumableCells = (inventories: any[]) => {
        return inventories.map((inv) => {
          return (
            <CellBordered
              key={inv.id}
              style={{ gridColumn: `${inv.id}` }}
            >
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
          text='Collect' />
      );

      const FeedButton = (kami: any, foodIndex: number) => (
        <ActionButton
          id={`feed-${foodIndex}`}
          onClick={() => feed(kami.id, foodIndex)}
          text={`Feed ${foodIndex}`} />
      );

      const StartButton = (kami: any) => (
        <ActionButton
          id={`harvest-start`}
          onClick={() => startProduction(kami.id)}
          text='Start' />
      );

      const StopButton = (kami: any) => (
        <ActionButton
          id={`harvest-stop`}
          onClick={() => stopProduction(kami.production.id)}
          text='Stop' />
      );

      const KamiCards = (kamis: any[]) => {
        return kamis.map((kami) => {
          const title = getTitle(kami);
          const description = getDescription(kami);
          const action = isHarvesting(kami) ? StopButton(kami) : StartButton(kami);

          return (
            <KamiCard
              key={kami.id}
              title={title}
              image={kami.uri}
              subtext={`+${calcOutput(kami).toFixed(1)} $KAMI`}
              action={action}
              cornerContent={FeedButton(kami, 1)}
              description={description}
            />
          )
        })
      };

      return (
        <ModalWrapperFull id='party_modal' divName='party' fill={true}>
          <TopGrid>
            <TopDescription>
              Bytes: {data.account.bytes ? data.account.bytes * 1 : '0'}
            </TopDescription>
          </TopGrid>
          <ConsumableGrid>
            {ConsumableCells(data.account.inventories)}
          </ConsumableGrid>
          <Scrollable>
            {KamiCards(data.pets)}
          </Scrollable>
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

const CellBorderless = styled.div`
  border-style: solid;
  border-width: 0px 2px 0px 0px;
  border-color: black;
`;

const CellOne = styled.div`
  grid-column: 1;
  border-style: solid;
  border-width: 0px 2px 0px 0px;
  border-color: black;
`;

const CellTwo = styled.div`
  grid-column: 2;
  border-style: solid;
  border-width: 0px 2px 0px 0px;
  border-color: black;
`;

const CellThree = styled.div`
  grid-column: 3;
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
