import React, { useEffect, useRef, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { EntityID, EntityIndex } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';

import { Items } from './Items';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { Kami } from 'layers/react/shapes/Kami';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import 'layers/react/styles/font.css';
import { Kards } from './Kards';


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
          components: {
            AccountID,
            Balance,
            Coin,
            Health,
            HealthCurrent,
            IsConfig,
            LastTime,
            Location,
            MediaURI,
            Name,
            OwnerAddress,
            Rate,
            State,
            StartTime,
            Value,
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
        Health.update$,
        IsConfig.update$,
        LastTime.update$,
        Location.update$,
        MediaURI.update$,
        Name.update$,
        OwnerAddress.update$,
        Rate.update$,
        StartTime.update$,
        State.update$,
        Value.update$,
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(
            layers,
            { inventory: true, kamis: true },
          );

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
      // console.log('PartyM: data', data);
      const {
        visibleModals,
        setVisibleModals,
        selectedEntities,
        setSelectedEntities,
      } = dataStore();


      /////////////////
      // STATE TRACKING

      // NOTE: not currently in use
      const scrollableRef = useRef<HTMLDivElement>(null);
      const [scrollPosition, setScrollPosition] = useState<number>(0);
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


      /////////////////
      // INTERACTION

      // feed a kami
      const feedKami = (kami: Kami, foodIndex: number) => {
        const actionID = `Feeding ${kami.name}` as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.pet.feed(kami.id, foodIndex);
          },
        });
      };

      // revive a kami using a revive item
      const reviveKami = (kami: Kami, reviveIndex: number) => {
        const actionID = `Reviving ${kami.name}` as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.pet.revive(kami.id, reviveIndex);
          },
        });
      };

      // reveal kami
      const revealKami = async (kami: Kami) => {
        const actionID = `Revealing ${kami.name}` as EntityID;
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


      return (
        <ModalWrapperFull id='party_modal' divName='party'>
          <Items inventories={data.account.inventories!}></Items>
          <Scrollable ref={scrollableRef}>
            <Kards
              kamis={data.account.kamis!}
              account={data.account}
              actions={{
                feed: feedKami,
                revive: reviveKami,
                reveal: revealKami,
              }}
            />
          </Scrollable>
        </ModalWrapperFull>
      );
    }
  );
}

const Scrollable = styled.div`
  overflow-y: scroll;
  height: 100 %;
  max-height: 100 %;
`;