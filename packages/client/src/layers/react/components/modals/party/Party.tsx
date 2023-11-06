import React from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { EntityID, EntityIndex } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';

import { Kards } from './Kards';
import { kamiIcon } from 'assets/images/icons/menu';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { Kami } from 'layers/react/shapes/Kami';
import { dataStore } from 'layers/react/store/createStore';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';
import 'layers/react/styles/font.css';


export function registerPartyModal() {
  registerUIComponent(
    'PartyList',
    {
      colStart: 2,
      colEnd: 33,
      rowStart: 8,
      rowEnd: 99,
    },

    // Requirement (Data Manangement)
    (layers) => {
      const {
        network: {
          actions,
          api: { player },
          components: {
            AccountID,
            Balance,
            Coin,
            Harmony,
            Health,
            HealthCurrent,
            HolderID,
            IsBonus,
            IsConfig,
            LastTime,
            Location,
            MediaURI,
            Name,
            OwnerAddress,
            Power,
            Rate,
            State,
            StartTime,
            Type,
            Value,
          },
          world,
        },
      } = layers;

      return merge(
        AccountID.update$,
        Balance.update$,
        Coin.update$,
        Harmony.update$,
        HealthCurrent.update$,
        Health.update$,
        HolderID.update$,
        IsBonus.update$,
        IsConfig.update$,
        LastTime.update$,
        Location.update$,
        MediaURI.update$,
        Name.update$,
        OwnerAddress.update$,
        Power.update$,
        Rate.update$,
        StartTime.update$,
        State.update$,
        Type.update$,
        Value.update$,
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(
            layers,
            { inventory: true, kamis: true },
          );

          return {
            layers,
            actions,
            api: player,
            data: { account },
            world,
          };
        })
      );
    },

    // Render
    ({ layers, actions, api, data, world }) => {
      // console.log('PartyM: data', data);
      const { visibleModals, setVisibleModals } = dataStore();
      const { setKami } = useSelectedEntities();


      /////////////////
      // INTERACTION

      // feed a kami
      const feed = (kami: Kami, foodIndex: number) => {
        const actionID = `Feeding ${kami.name}` as EntityID; // Date.now to have the actions ordered in the component browser
        actions?.add({
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
      const revive = (kami: Kami, reviveIndex: number) => {
        const actionID = `Reviving ${kami.name}` as EntityID; // Date.now to have the actions ordered in the component browser
        actions?.add({
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
      const reveal = async (kami: Kami) => {
        const actionID = `Revealing ${kami.name}` as EntityID;
        actions?.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.ERC721.reveal(kami.index);
          },
        });
        await waitForActionCompletion(
          actions?.Action!,
          world.entityToIndex.get(actionID) as EntityIndex
        );
        openKamiModal(kami.entityIndex);
      };

      const openKamiModal = (entityIndex: EntityIndex) => {
        setKami(entityIndex);
        setVisibleModals({ ...visibleModals, kami: true });
      };


      return (
        <ModalWrapperFull
          id='party_modal'
          divName='party'
          header={<ModalHeader title='Party' icon={kamiIcon} />}
          canExit
        >
          <Kards
            kamis={data.account.kamis!}
            account={data.account}
            actions={{ feed, revive, reveal }}
          />
        </ModalWrapperFull>
      );
    }
  );
}

const Header = styled.div`
  font-size: 1.5vw;
  color: #333;
  text-align: left;
  padding: 1.2vw 1.8vw;
  font-family: Pixel;
`;