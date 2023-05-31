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
import ribbon from 'assets/images/food/ribbon.png';

export function registerPartyModal() {
  registerUIComponent(
    'PartyList',
    {
      colStart: 2,
      colEnd: 33,
      rowStart: 3,
      rowEnd: 99,
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
            Name,
            OperatorAddress,
            OwnerAddress,
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
            text: 'Gum - Restores 25 health.',
          },
          {
            id: 2,
            itemIndex: 2,
            image: pompom,
            balance: 0,
            text: 'PomPom - Restores 100 health.',
          },
          {
            id: 3,
            itemIndex: 3,
            image: gakki,
            balance: 0,
            text: 'Gakki - Restores 200 health.',
          },
          {
            id: 4,
            itemIndex: 4,
            image: ribbon,
            balance: 0,
            text: 'Ribbon - Revives a fallen Kami.',
          },
        ];
      };

      return merge(
        AccountID.update$,
        Balance.update$,
        Coin.update$,
        HealthCurrent.update$,
        Location.update$,
        OwnerAddress.update$,
        Rate.update$,
        StartTime.update$,
        State.update$,
        MediaURI.update$,
        Name.update$
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

          // populate the account with kamis and inventories 
          let kamis: Kami[] = [];
          let inventories: any = hardCodeInventory();
          if (account) {
            // get the kamis on this account
            const kamiIndices = Array.from(
              runQuery([
                Has(IsPet),
                HasValue(AccountID, { value: account.id })
              ])
            );

            for (let i = 0; i < kamiIndices.length; i++) {
              kamis.push(getKami(layers, kamiIndices[i], { production: true }));
            }

            // (hardcoded structures) populate inventory balances
            // get the list of inventory indices for this account
            const inventoryResults = Array.from(
              runQuery([Has(IsInventory), HasValue(HolderID, { value: account.id })])
            );

            let itemIndex;
            for (let i = 0; i < inventoryResults.length; i++) {
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

      // feed a kami
      const feedKami = (kami: Kami, foodIndex: number) => {
        const actionID = `Feeding Kami` as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          // on: data.????,
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.pet.feed(kami.id, foodIndex);
          },
        });
      };

      // revive a kami using a revive item
      const reviveKami = (kami: Kami, reviveIndex: number) => {
        const actionID = `Reviving Kami ${kami.id}` as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          // on: data.????,
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.pet.revive(kami.id, reviveIndex);
          },
        });
      };

      // reveal kami
      const revealKami = async (kami: Kami) => {
        const actionID = (`Revealing Kami ` + kami.index) as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.ERC721.reveal(kami.index);
          },
        });
        await waitForActionCompletion(
          actions.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
        openKamiModal(kami.entityIndex);
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
      const calcDrainRate = (kami: Kami): number => {
        return calcProductionRate(kami) / 2.0;
      };

      // calculate the recovery rate based on the harmony stat of the kami (KAMI/s)
      const calcRecoveryRate = (kami: Kami): number => {
        let rate = 0;
        if (isResting(kami)) {
          rate = kami.stats.harmony / 3600;
        }
        return rate;
      };

      // get emission rate of the Kami's production. measured in (KAMI/s)
      const calcProductionRate = (kami: Kami): number => {
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
      const calcOutput = (kami: Kami): number => {
        let output = 0;
        if (isHarvesting(kami) && !isDead(kami)) {
          let duration = lastRefresh / 1000 - kami.production!.startTime;
          output = Math.floor(duration * calcProductionRate(kami));
        }
        return Math.max(output, 0);
      };

      // interpret the location of the kami based on the kami's state
      const getLocation = (kami: Kami): number => {
        let location = 0;
        if (!isHarvesting(kami)) location = data.account.location;
        else if (kami.production && kami.production.node) {
          location = kami.production.node.location;
        }
        return location;
      };

      const isFull = (kami: Kami): boolean => {
        return Math.round(calcHealth(kami)) >= kami.stats.health;
      };

      const hasFood = (): boolean => {
        const inventories = data.account.inventories;
        const foodInventories = inventories.slice(0, 3);

        let totalBalance = 0;
        for (let i = 0; i < foodInventories.length; i++) {
          totalBalance += foodInventories[i].balance;
        }
        return totalBalance > 0;
      }

      // get the reason why a kami can't feed. assume the kami is either resting or harvesting
      const whyCantFeed = (kami: Kami): string => {
        let reason = '';
        if (getLocation(kami) != data.account.location) {
          reason = `${kami.name} is not at your location`;
        } else if (isFull(kami)) {
          reason = `${kami.name} is already full`;
        } else if (!hasFood()) {
          reason = `go buy food, poore`;
        }
        return reason;
      }

      const canFeed = (kami: Kami): boolean => {
        return !whyCantFeed(kami);
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

      interface TooltipProps {
        show: boolean;
      }

      const Tooltip = styled.div<TooltipProps>`
        position: absolute;
        transform: translatey(10px) translateX(-40%);
        top: 20px;
        left: 60px;
        padding: 5px;
        background-color: #ffffff;
        font-size: 12px;
        font-family: Pixel;
        opacity: ${(props) => (props.show ? 1 : 0)};
        visibility: ${(props) => (props.show ? 'visible' : 'hidden')};
        transition: all 0.3s ease-in-out;
        border-style: solid;
        border-width: 2px;
        border-color: black;
        color: black;
      `;

      const ConsumableCells = (inventories: any[], showIndex: number, setToolTip: any) => {
        return inventories.map((inv, i) => {
          return (
            <CellBordered key={inv.id} id={inv.id} style={{ gridColumn: `${inv.id}` }}>
              <div style={{ position: 'relative' }}>
                <CellGrid
                  onMouseOver={() => {
                    setToolTip(i);
                  }}
                  onMouseLeave={() => {
                    setToolTip(-1);
                  }}
                >
                  {!visibleModals.kami && (
                    <Tooltip show={i === showIndex ? true : false}>{inv.text}</Tooltip>
                  )}
                  <Icon src={inv.image} />
                  <ItemNumber>{inv.balance ?? 0}</ItemNumber>
                </CellGrid>
              </div>
            </CellBordered>
          );
        });
      };

      const FeedButton = (kami: Kami) => {
        const feedOptions: ActionListOption[] = [
          { text: 'Ghost Gum', onClick: () => feedKami(kami, 1) },
          { text: 'Fruit Candy', onClick: () => feedKami(kami, 2) },
          { text: 'Cookie Sticks', onClick: () => feedKami(kami, 3) },
        ];

        return (
          <ActionListButton
            id={`feedKami-button-${kami.index}`}
            text='Feed'
            hidden={true}
            disabled={!canFeed(kami)}
            scrollPosition={scrollPosition}
            options={feedOptions}
          />
        );
      };

      const RevealButton = (kami: Kami) => (
        <ActionButton id={`reveal-kami`} onClick={() => revealKami(kami)} text='Reveal' />
      );

      const ReviveButton = (kami: Kami) => (
        <ActionButton id={`revive-kami`} onClick={() => reviveKami(kami, 1)} text='Revive' />
      );

      // Choose and return the action button to display
      const DisplayedAction = (kami: Kami) => {
        if (isUnrevealed(kami)) return RevealButton(kami);
        if (isResting(kami)) return FeedButton(kami);
        if (isHarvesting(kami)) return FeedButton(kami);
        if (isDead(kami)) return ReviveButton(kami);
      };

      // Rendering of Individual Kami Cards in the Party Modal
      const KamiCards = (kamis: Kami[]) => {
        return kamis.map((kami) => {
          const action = DisplayedAction(kami);
          const description = getDescription(kami);
          const healthString = !isUnrevealed(kami)
            ? `(${calcHealth(kami).toFixed()}/${kami.stats.health * 1})`
            : '';

          return (
            <KamiCard
              key={kami.id}
              kami={kami}
              description={description}
              subtext={`${calcOutput(kami)} $KAMI`}
              action={action}
              cornerContent={healthString}
            />
          );
        });
      };

      const [showTooltip, setShowTooltip] = useState(-1);

      return (
        <ModalWrapperFull id='party_modal' divName='party'>
          <ConsumableGrid>
            {ConsumableCells(data.account.inventories, showTooltip, setShowTooltip)}
          </ConsumableGrid>
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
