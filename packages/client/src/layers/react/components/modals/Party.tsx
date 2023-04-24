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
import { waitForActionCompletion } from '@latticexyz/std-client';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { dataStore } from 'layers/react/store/createStore';
import { KamiCard } from 'layers/react/components/library/KamiCard';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Account, getAccount } from 'layers/react/components/shapes/Account';
import { Kami, getKami } from 'layers/react/components/shapes/Kami';
import { Node, getNode } from 'layers/react/components/shapes/Node';
import { registerUIComponent } from 'layers/react/engine/store';
import 'layers/react/styles/font.css';

import pompom from 'assets/images/food/pompom.png';
import gakki from 'assets/images/food/gakki.png';
import gum from 'assets/images/food/gum.png';

export function registerPartyModal() {
  registerUIComponent(
    'PartyList',
    {
      colStart: 2,
      colEnd: 33,
      rowStart: 2,
      rowEnd: 76,
    },

    // Requirement (Data Manangement)
    (layers) => {
      const {
        network: {
          api: { player },
          network,
          components: {
            AccountID,
            Balance,
            HealthCurrent,
            Coin,
            HolderID,
            IsAccount,
            IsInventory,
            IsNode,
            IsPet,
            ItemIndex,
            Location,
            MediaURI,
            OperatorAddress,
            OwnerID,
            Rate,
            State,
            StartTime,
          },
          world,
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

      return merge(
        AccountID.update$,
        Balance.update$,
        Coin.update$,
        HealthCurrent.update$,
        Location.update$,
        OwnerID.update$,
        Rate.update$,
        StartTime.update$,
        State.update$,
        MediaURI.update$
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
          const nodeIndex = Array.from(
            runQuery([Has(IsNode), HasValue(Location, { value: account.location })])
          )[0];

          const node = nodeIndex !== undefined ? getNode(layers, nodeIndex) : ({} as Node);

          // get the list of inventory indices for this account
          const inventoryResults = Array.from(
            runQuery([Has(IsInventory), HasValue(HolderID, { value: account.id })])
          );

          // if we have inventories for the account, generate a list of inventory objects
          let kamis: Kami[] = [];
          let inventories: any = hardCodeInventory();
          if (account) {
            // get the kamis on this account
            const kamiIndices = Array.from(
              runQuery([Has(IsPet), HasValue(AccountID, { value: account.id })])
            );

            // get all kamis on the node
            for (let i = 0; i < kamiIndices.length; i++) {
              kamis.push(getKami(layers, kamiIndices[i], { production: true }));
            }

            // (hardcoded structures) populate inventory balances
            let itemIndex;
            for (let i = 0; i < inventoryResults.length; i++) {
              // match indices to the existing consumables
              itemIndex = getComponentValue(ItemIndex, inventoryResults[i])?.value as number;
              for (let j = 0; j < inventories.length; j++) {
                if (inventories[j].itemIndex == itemIndex) {
                  let balance = getComponentValue(Balance, inventoryResults[j])?.value as number;
                  inventories[j].balance = balance ? balance * 1 : 0;
                }
              }
            }
          }

          return {
            actions,
            api: player,
            data: {
              account: { ...account, inventories, kamis },
              node,
            } as any,
            world,
          };
        })
      );
    },

    // Render
    ({ actions, api, data, world }) => {
      const { visibleModals, setVisibleModals, selectedEntities, setSelectedEntities } =
        dataStore();

      // console.log('PartyM: data', data);
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
      const feed = (petID: EntityID, foodIndex: number) => {
        const actionID = `Feeding Kami` as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          // on: data.????,
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.food.feed(petID, foodIndex);
          },
        });
      };

      // reveal pet
      const revealPet = async (pet: Kami) => {
        const actionID = (`Revealing Kami ` + pet.index) as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.ERC721.reveal(pet.index);
          },
        });
        await waitForActionCompletion(
          actions.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
        openKamiModal(pet);
      };

      const openKamiModal = (kami: Kami) => {
        const description = kami.index;
        setSelectedEntities({
          ...selectedEntities,
          kami: { ...selectedEntities.kami, description },
        });
        setVisibleModals({ ...visibleModals, kami: true });
      };

      /////////////////
      // DATA INTERPRETATION
      const RATE_PRECISION = 1e6;
      const DEMO_RECOVERY_MULTIPLIER = 1e2;

      // get the health drain rate, based on the kami's production
      // this is based on a hardcoded value for the time being
      const calcDrainRate = (kami: Kami) => {
        return calcProductionRate(kami) / 2.0;
      };

      // calculate the recovery rate based on the harmony stat of the kami (KAMI/s)
      const calcRecoveryRate = (kami: Kami) => {
        let rate = 0;
        if (isResting(kami)) {
          rate = DEMO_RECOVERY_MULTIPLIER * kami.stats.harmony / 3600;
        }
        return rate;
      }

      // get emission rate of the Kami's production. measured in (KAMI/s)
      const calcProductionRate = (kami: Kami) => {
        let rate = 0;
        if (isHarvesting(kami)) {
          rate = kami.production!.rate / RATE_PRECISION;
        }
        return rate;
      };

      // calculate health based on the drain against last confirmed health
      const calcHealth = (kami: Kami): number => {
        let health = 1 * kami.health;
        let duration = lastRefresh / 1000 - kami.lastUpdated;

        // calculate the health drain on the kami since the last health update
        if (isHarvesting(kami)) {
          let drainRate = calcDrainRate(kami);
          let healthDrain = drainRate * duration;
          health -= healthDrain;
          health = Math.max(health, 0);
        } else if (isResting(kami)) {
          let recoveryRate = calcRecoveryRate(kami);
          let healthRecovery = recoveryRate * duration;
          health += healthRecovery;
          health = Math.min(health, kami.stats.health);
        }
        return health;
      };

      // calculate the expected output from a pet production based on starttime
      // set to N/A if dead
      const calcOutput = (kami: Kami) => {
        let output = 0;
        if (isHarvesting(kami) && !isDead(kami)) {
          let duration = lastRefresh / 1000 - kami.production!.startTime;
          output = Math.round(duration * calcProductionRate(kami));
        }
        return Math.max(output, 0);
      };

      // naive check right now, needs to be updated with murder check as well
      const isDead = (kami: Kami): boolean => {
        return kami.state === 'DEAD' ||
          calcHealth(kami) == 0;  // shoudl we include this check as well?
      };

      // check whether the kami is currently harvesting
      const isHarvesting = (kami: Kami): boolean => {
        return kami.state === 'HARVESTING' && kami.production != undefined;
      };

      const isResting = (kami: Kami): boolean => {
        return kami.state === 'RESTING';
      }

      const isRevealed = (kami: Kami): boolean => {
        return !(kami.state === 'UNREVEALED');
      };

      const isOffWorld = (kami: Kami): boolean => {
        return kami.state === '721_EXTERNAL';
      }

      // get the title of the kami as 'name (health / totHealth)'
      const getTitle = (kami: Kami) => {
        let title = kami.name;
        if (isRevealed(kami)) {
          const health = calcHealth(kami);
          title += ` (${health.toFixed()}/${kami.stats.health * 1})`;
        }
        return title;
      };

      // get the description of the kami as a list of lines
      // TODO: clean this up
      const getDescription = (kami: Kami): string[] => {
        let description: string[] = [];

        switch (kami.state) {
          case '721_EXTERNAL':
            description = ['kidnapped by slave traders'];
            break;
          case 'UNREVEALED':
            description = ['unrevealed!'];
            break;
          case 'RESTING':
            description = ['resting'];
            break;
          case 'HARVESTING':
            if (kami.production) {
              const harvestRate = calcProductionRate(kami) * 3600; //hourly
              const drainRate = calcDrainRate(kami) * 3600; //hourly
              description = [
                `Harvesting on ${kami.production!.node!.name}`,
                `+${harvestRate.toFixed(1)} $KAMI/hr`,
                `-${drainRate.toFixed(1)} HP/hr`,
              ];
              break;
            }
          case 'DEAD':
            description = [`Murdered by ???`];
            break;
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

      // we're able to force the production attribute as we will only show this
      // button if the kami is harvesting
      const CollectButton = (kami: Kami) => (
        <ActionButton
          id={`harvest-collect`}
          onClick={() => reapProduction(kami.production!.id)}
          text='Collect'
        />
      );

      const FeedButton = (kami: Kami, foodIndex: number) => (
        <ActionButton
          id={`feed-${foodIndex}`}
          onClick={() => feed(kami.id, foodIndex)}
          text={`Feed ${foodIndex}`}
        />
      );

      const StartButton = (kami: Kami) => (
        <ActionButton id={`harvest-start`} onClick={() => startProduction(kami.id)} text='Start' />
      );

      // we're able to force the production attribute as we will only show this
      // button if the kami is harvesting
      const StopButton = (kami: Kami) => (
        <ActionButton
          id={`harvest-stop`}
          onClick={() => stopProduction(kami.production!.id)}
          text='Stop'
        />
      );

      const RevealButton = (kami: Kami) => (
        <ActionButton id={`reveal-kami`} onClick={() => revealPet(kami)} text='Reveal' />
      );

      const InfoButton = (kami: Kami) => (
        <ActionButton id={`info-button`} onClick={() => openKamiModal(kami)} text='i' />
      );

      const selectAction = (kami: Kami) => {
        if (!isRevealed(kami)) return RevealButton(kami);

        if (isHarvesting(kami)) return StopButton(kami);
        else return StartButton(kami);
      };

      // corner content, usually Food
      const selectCornerContent = (kami: Kami) => {
        if (isRevealed(kami)) return FeedButton(kami, 1);
      }

      const selectInfo = (kami: Kami) => {
        if (isRevealed(kami)) return InfoButton(kami);
      };

      const KamiCards = (kamis: Kami[]) => {
        return kamis.map((kami) => {
          const title = getTitle(kami);
          const description = getDescription(kami);
          const action = selectAction(kami);

          return (
            <KamiCard
              key={kami.id}
              title={title}
              image={kami.uri}
              subtext={`${calcOutput(kami)} $KAMI`}
              action={action}
              cornerContent={selectCornerContent(kami)}
              info={selectInfo(kami)}
              description={description}
            />
          );
        });
      };

      return (
        <ModalWrapperFull id='party_modal' divName='party' fill={true}>
          <TopGrid>
            <TopDescription>
              $KAMI: {data.account.coin ? data.account.coin * 1 : '0'}
            </TopDescription>
          </TopGrid>
          <ConsumableGrid>{ConsumableCells(data.account.inventories)}</ConsumableGrid>
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
  border-width: 2px 0px 2px 2px;
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
