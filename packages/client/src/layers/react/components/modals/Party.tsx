import React, { useEffect, useRef, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { EntityID, EntityIndex, Has, HasValue, runQuery } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ActionListButton } from 'layers/react/components/library/ActionListButton';
import { dataStore } from 'layers/react/store/createStore';
import { KamiCard } from 'layers/react/components/library/KamiCard';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { getConfigFieldValue } from 'layers/react/components/shapes/Config';
import { AccountInventories, getAccount } from 'layers/react/components/shapes/Account';
import { Kami } from 'layers/react/components/shapes/Kami';
import { Inventory, getInventoryByFamilyIndex } from 'layers/react/components/shapes/Inventory';
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
            IsAccount,
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
          // get the account through the account entity of the controlling wallet
          const accountIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(OperatorAddress, {
                value: network.connectedAddress.get(),
              }),
            ])
          )[0];

          const account = getAccount(layers, accountIndex, { inventory: true, kamis: true });

          return {
            actions,
            api: player,
            data: { account },
            world,
          };
        })
      );
    },

    // Render
    ({ actions, api, data, world }) => {
      console.log('PartyM: data', data);
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

      // calculate health based on the drain against last confirmed health
      const calcHealth = (kami: Kami): number => {
        let health = 1 * kami.health;
        let duration = lastRefresh / 1000 - kami.lastUpdated;
        health += kami.healthRate * duration;
        health = Math.min(Math.max(health, 0), kami.stats.health);
        return health;
      };

      // converts a per-second rate to a per-hour rate string with a given precision
      const getRateDisplay = (rate: number | undefined, roundTo: number): string => {
        if (rate === undefined) rate = 0;
        let hourlyRate = rate * 3600;
        let display = hourlyRate.toString();
        if (roundTo) {
          hourlyRate *= 10 ** roundTo;
          hourlyRate = Math.round(hourlyRate);
          hourlyRate /= 10 ** roundTo;
          display = hourlyRate.toFixed(roundTo);
        }
        if (hourlyRate > 0) display = '+' + display;
        return display;
      };

      // calculate the expected output from a pet production based on starttime
      const calcOutput = (kami: Kami): number => {
        let output = 0;
        if (isHarvesting(kami) && kami.production) {
          let duration = lastRefresh / 1000 - kami.production.startTime;
          output = Math.floor(duration * kami.production?.rate);
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
        return data.account.inventories!.food.length > 0;
      };

      const hasRevive = (): boolean => {
        return data.account.inventories!.revives.length > 0;
      };

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
      };

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
        const healthRate = getRateDisplay(kami.healthRate, 2);

        let description: string[] = [];
        if (isOffWorld(kami)) {
          description = ['kidnapped by slave traders'];
        } else if (isUnrevealed(kami)) {
          description = ['Unrevealed!'];
        } else if (isResting(kami)) {
          description = ['Resting', `${healthRate} HP/hr`];
        } else if (isDead(kami)) {
          description = [`Murdered`];
          if (kami.deaths && kami.deaths.length > 0) {
            description.push(`by ${kami.deaths[0]!.source!.name}`);
            description.push(`on ${kami.deaths[0]!.node.name} `);
          }
        } else if (isHarvesting(kami)) {
          if (calcHealth(kami) == 0) {
            description = [`Starving.. `, `on ${kami.production!.node!.name}`];
          } else {
            const harvestRate = getRateDisplay(kami.production?.rate, 2);
            description = [
              `Harvesting`,
              `on ${kami.production!.node!.name}`,
              `${harvestRate} $KAMI/hr`,
              `${healthRate} HP/hr`,
            ];
          }
        }
        return description;
      };

      /////////////////
      // DISPLAY

      // get the row of consumable items to display in the player inventory
      const ConsumableCells = (
        inventories: AccountInventories,
        showIndex: number,
        setToolTip: any
      ) => {
        const inventorySlots = [
          {
            id: 1,
            image: gum,
            text: 'Gum - Restores 25 health.',
            inventory: getInventoryByFamilyIndex(inventories?.food, 1),
          },
          {
            id: 2,
            image: pompom,
            text: 'PomPom - Restores 100 health.',
            inventory: getInventoryByFamilyIndex(inventories?.food, 2),
          },
          {
            id: 3,
            image: gakki,
            text: 'Gakki - Restores 200 health.',
            inventory: getInventoryByFamilyIndex(inventories?.food, 3),
          },
          {
            id: 4,
            image: ribbon,
            text: 'Ribbon - Revives a fallen Kami.',
            inventory: getInventoryByFamilyIndex(inventories?.revives, 1),
          },
        ];

        return inventorySlots.map((slot, i) => {
          return (
            <CellBordered key={slot.id} style={{ gridColumn: `${slot.id}` }}>
              <div style={{ position: 'relative' }}>
                <CellGrid onMouseOver={() => setToolTip(i)} onMouseLeave={() => setToolTip(-1)}>
                  {!visibleModals.kami && (
                    <Tooltip show={i === showIndex ? true : false} text={slot.text} />
                  )}
                  <Icon src={slot.image} />
                  <ItemNumber>{slot.inventory?.balance ?? 0}</ItemNumber>
                </CellGrid>
              </div>
            </CellBordered>
          );
        });
      };

      const FeedButton = (kami: Kami) => {
        const nonEmptyOptions = data.account.inventories!.food.filter(
          (inv: Inventory) => inv.balance && inv.balance > 0
        );

        const feedOptions = nonEmptyOptions.map((inv: Inventory) => {
          return {
            text: inv.item.name,
            onClick: () => feedKami(kami, inv.item.familyIndex),
          };
        });

        const canFeedKami = canFeed(kami);
        const tooltipText = whyCantFeed(kami);

        const TooltipButton = () => {
          const [showTooltip, setShowTooltip] = useState(false);
          const [positionTop, setPositionTop] = useState('');

          const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
            setShowTooltip(true);
            const topPosition = window.innerHeight - event.clientY > 200 ? '-10px' : '-100px';
            setPositionTop(topPosition);
          };

          const handleMouseLeave = () => {
            setShowTooltip(false);
            setPositionTop('');
          };

          return (
            <div
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={{ position: 'relative' }}
            >
              <ActionListButton
                id={`feedKami-button-${kami.index}`}
                text='Feed'
                hidden={true}
                disabled={!canFeedKami}
                scrollPosition={scrollPosition}
                options={feedOptions}
              />
              {!canFeedKami && showTooltip && (
                <Tooltip show={true} text={tooltipText} positionTop={positionTop} />
              )}
            </div>
          );
        };

        return <TooltipButton />;
      };

      const RevealButton = (kami: Kami) => (
        <ActionButton id={`reveal-kami`} onClick={() => revealKami(kami)} text='Reveal' />
      );

      const ReviveButton = (kami: Kami) => (
        <ActionButton
          id={`revive-kami`}
          onClick={() => reviveKami(kami, 1)}
          text='Revive'
          disabled={!hasRevive()}
        />
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
        const reversed = [...kamis];
        reversed.reverse();
        return reversed.map((kami) => {
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
            {ConsumableCells(data.account.inventories!, showTooltip, setShowTooltip)}
          </ConsumableGrid>
          <Scrollable ref={scrollableRef}>{KamiCards(data.account.kamis!)}</Scrollable>
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
