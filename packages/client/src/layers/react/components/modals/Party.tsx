import React, { useEffect, useRef, useState } from 'react';
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
import {
  ActionListButton,
  Option as ActionListOption,
} from 'layers/react/components/library/ActionListButton';
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
      rowStart: 8,
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
      // console.log('PartyM: data', data);
      const { visibleModals, setVisibleModals, selectedEntities, setSelectedEntities } =
        dataStore();

      /////////////////
      // STATE TRACKING

      const scrollableRef = useRef<HTMLDivElement>(null);
      const [scrollPosition, setScrollPosition] = useState<number>(0);
      const [lastRefresh, setLastRefresh] = useState(Date.now());

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

      /////////////////
      // INTERACTIONS

      // feedKami pet, no inventory check
      const feedKami = (petID: EntityID, foodIndex: number) => {
        const actionID = `Feeding Kami` as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          // on: data.????,
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.ERC721.feed(petID, foodIndex);
          },
        });
      };

      // reveal pet
      const revealKami = async (pet: Kami) => {
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
        openKamiModal(pet.entityIndex);
      };

      const openKamiModal = (entityIndex: EntityIndex) => {
        setSelectedEntities({
          ...selectedEntities,
          kami: entityIndex,
        });
        setVisibleModals({ ...visibleModals, kami: true });
      };

      /////////////////
      // DATA INTERPRETATION

      const RATE_PRECISION = 1e6;

      // get the health drain rate, based on the kami's production
      // this is based on a hardcoded value for the time being
      const calcDrainRate = (kami: Kami) => {
        return calcProductionRate(kami) / 2.0;
      };

      // calculate the recovery rate based on the harmony stat of the kami (KAMI/s)
      const calcRecoveryRate = (kami: Kami) => {
        let rate = 0;
        if (isResting(kami)) {
          rate = kami.stats.harmony / 3600;
        }
        return rate;
      };

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
        return kami.state === 'DEAD';
      };

      // check whether the kami is harvesting
      const isHarvesting = (kami: Kami): boolean =>
        kami.state === 'HARVESTING' && kami.production != undefined;

      // check whether the kami is resting
      const isResting = (kami: Kami): boolean => {
        return kami.state === 'RESTING';
      };

      // check whether the kami is revealed
      const isUnrevealed = (kami: Kami): boolean => {
        return kami.state === 'UNREVEALED';
      };

      // check whether the kami is captured by slave traders
      const isOffWorld = (kami: Kami): boolean => {
        return kami.state === '721_EXTERNAL';
      };

      // get the description of the kami as a list of lines
      // TODO: clean this up
      const getDescription = (kami: Kami): string[] => {
        let description: string[] = [];

        if (isOffWorld(kami)) {
          description = ['kidnapped by slave traders'];
        } else if (isUnrevealed(kami)) {
          description = ['unrevealed!'];
        } else if (isResting(kami)) {
          description = ['resting'];
        } else if (isDead(kami)) {
          description = [`murdered by ???`];
        } else if (isHarvesting(kami)) {
          if (calcHealth(kami) == 0) {
            description = [`died of dysentery`];
          } else {
            const harvestRate = calcProductionRate(kami) * 3600; //hourly
            const drainRate = calcDrainRate(kami) * 3600; //hourly
            description = [
              `Harvesting on ${kami.production!.node!.name}`,
              `+${harvestRate.toFixed(1)} $KAMI/hr`,
              `-${drainRate.toFixed(1)} HP/hr`,
            ];
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
            <CellBordered key={inv.id} id={inv.id} style={{ gridColumn: `${inv.id}` }}>
              <CellGrid>
                <Icon src={inv.image} />
                <ItemNumber>{inv.balance ?? 0}</ItemNumber>
              </CellGrid>
            </CellBordered>
          );
        });
      };

      const FeedButton = (kami: Kami, disabled: boolean) => {
        const feedOptions: ActionListOption[] = [
          { text: 'Maple-Flavor Ghost Gum', onClick: () => feedKami(kami.id, 1) },
          { text: 'Pom-Pom Fruit Candy', onClick: () => feedKami(kami.id, 2) },
          { text: 'Gakki Cookie Sticks', onClick: () => feedKami(kami.id, 3) },
        ];

        return (
          <ActionListButton
            id={`feedKami-button-${kami.index}`}
            text='Feed'
            hidden={true}
            disabled={disabled}
            scrollPosition={scrollPosition}
            options={feedOptions}
          />
        );
      };

      const RevealButton = (kami: Kami) => (
        <ActionButton id={`reveal-kami`} onClick={() => revealKami(kami)} text='Reveal' />
      );

      const ReviveButton = (kami: Kami) => (
        <ActionButton id={`revive-kami`} onClick={() => null} text='Revive' disabled={true} />
      );

      // Choose and return the action button to display
      const DisplayedAction = (kami: Kami, isDisabled: boolean) => {
        if (isUnrevealed(kami)) return RevealButton(kami);
        if (isResting(kami)) return FeedButton(kami, isDisabled);
        if (isHarvesting(kami) && calcHealth(kami) > 0) return FeedButton(kami, isDisabled);
        if (isHarvesting(kami) && calcHealth(kami) == 0) return ReviveButton(kami);
        if (isDead(kami)) return ReviveButton(kami);
      };

      // Rendering of Individual Kami Cards in the Party Modal
      const KamiCards = (kamis: Kami[]) => {
        return kamis.map((kami) => {
          const isDisabled = +calcHealth(kami).toFixed() == kami.stats.health * 1;
          const action = DisplayedAction(kami, isDisabled);
          const description = getDescription(kami);
          const healthString = !isUnrevealed(kami)
            ? `(${calcHealth(kami).toFixed()}/${kami.stats.health * 1})`
            : '';

          return (
            <KamiCard
              key={kami.id}
              image={kami.uri}
              title={kami.name}
              description={description}
              subtext={`${calcOutput(kami)} $KAMI`}
              action={action}
              cornerContent={healthString}
              imageOnClick={() => openKamiModal(kami.entityIndex)}
              titleOnClick={() => openKamiModal(kami.entityIndex)}
            />
          );
        });
      };

      return (
        <ModalWrapperFull id='party_modal' divName='party' fill={true}>
          <ConsumableGrid>{ConsumableCells(data.account.inventories)}</ConsumableGrid>
          <Scrollable ref={scrollableRef}>{KamiCards(data.account.kamis)}</Scrollable>
        </ModalWrapperFull>
      );
    }
  );
}

const Scrollable = styled.div`
  overflow-y: scroll;
  height: 100%;
  max-height: 100%;
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
