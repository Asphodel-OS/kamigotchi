import { EntityID, EntityIndex } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';
import crypto from "crypto";
import React from 'react';
import { map, merge } from 'rxjs';

import { Kards } from './Kards';
import { kamiIcon } from 'assets/images/icons/menu';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { Kami } from 'layers/react/shapes/Kami';
import { useVisibility } from 'layers/react/store/visibility';
import { useSelected } from 'layers/react/store/selected';
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
            OperatorAddress,
            OwnerAddress,
            IsAccount,
            IsBonus,
            IsConfig,
            IsProduction,
            AccountID,
            HolderID,
            PetID,
            ItemIndex,
            PetIndex,
            LastTime,
            LastActionTime,
            StartTime,
            Balance,
            Coin,
            Harmony,
            Health,
            HealthCurrent,
            Location,
            MediaURI,
            Name,
            Rate,
            State,
            Type,
            Value,
          },
          world,
        },
      } = layers;

      return merge(
        OperatorAddress.update$,
        OwnerAddress.update$,
        IsAccount.update$,
        IsBonus.update$,
        IsConfig.update$,
        IsProduction.update$,
        AccountID.update$,
        HolderID.update$,
        PetID.update$,
        ItemIndex.update$,
        PetIndex.update$,
        LastTime.update$,
        LastActionTime.update$,
        StartTime.update$,
        Balance.update$,
        Coin.update$,
        Harmony.update$,
        HealthCurrent.update$,
        Health.update$,
        Location.update$,
        MediaURI.update$,
        Name.update$,
        Rate.update$,
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
      const { modals, setModals } = useVisibility();
      const { setKami } = useSelected();


      /////////////////
      // INTERACTION

      // feed a kami
      const feed = (kami: Kami, foodIndex: number) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'KamiFeed',
          params: [kami.id, foodIndex],
          description: `Feeding ${kami.name}`,
          execute: async () => {
            return api.pet.feed(kami.id, foodIndex);
          },
        });
      };

      // revive a kami using a revive item
      const revive = (kami: Kami, reviveIndex: number) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'KamiRevive',
          params: [kami.id, reviveIndex],
          description: `Reviving ${kami.name}`,
          execute: async () => {
            return api.pet.revive(kami.id, reviveIndex);
          },
        });
      };

      // reveal kami
      const reveal = async (kami: Kami) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'KamiReveal',
          params: [kami.index],
          description: `Inspecting ${kami.name}`,
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
        setModals({ ...modals, kami: true });
      };


      return (
        <ModalWrapper
          id='party_modal'
          divName='party'
          header={<ModalHeader title='Party' icon={kamiIcon} />}
          canExit
        >
          <Kards
            kamis={data.account.kamis ? data.account.kamis : []}
            account={data.account}
            actions={{ feed, revive, reveal }}
          />
        </ModalWrapper>
      );
    }
  );
}