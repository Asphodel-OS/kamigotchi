import React from 'react';
import { map, merge } from 'rxjs';
import { EntityID } from '@latticexyz/recs';

import { Banner } from './Banner';
import { KillLogs } from './KillLogs';
import { Traits } from './Traits';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { Kami, getKami } from 'layers/react/shapes/Kami';
import { dataStore } from 'layers/react/store/createStore';

export function registerKamiModal() {
  registerUIComponent(
    'KamiDetails',
    {
      colStart: 23,
      colEnd: 81,
      rowStart: 3,
      rowEnd: 99,
    },
    (layers) => {
      const {
        network: {
          components: {
            Balance,
            Experience,
            IsPet,
            IsKill,
            Level,
            MediaURI,
            Name,
            PetID,
            SourceID,
            TargetID,
          },
        },
      } = layers;
      return merge(
        Balance.update$,
        IsPet.update$,
        IsKill.update$,
        Experience.update$,
        Level.update$,
        MediaURI.update$,
        Name.update$,
        PetID.update$,
        SourceID.update$,
        TargetID.update$,
      ).pipe(
        map(() => {
          return {
            layers,
            actions: layers.network.actions,
            api: layers.network.api.player,
          };
        })
      );
    },

    ({ layers, actions, api }) => {
      const { selectedEntities } = dataStore();


      /////////////////
      // DATA FETCHING

      const getSelectedKami = () => {
        return getKami(
          layers,
          selectedEntities.kami,
          {
            account: true,
            deaths: true,
            kills: true,
            traits: true,
          }
        );
      }

      /////////////////
      // ACTIONS

      const levelUp = (kami: Kami) => {
        const actionID = `Leveling up ${kami.name}` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.pet.level(kami.id);
          },
        })
      }


      /////////////////
      // DISPLAY

      return (
        <ModalWrapperFull
          divName='kami'
          id='kamiModal'
          header={<Banner kami={getSelectedKami()} actions={{ levelUp }}></Banner>}
          canExit
          overlay
        >
          <Traits kami={getSelectedKami()} />
          <KillLogs kami={getSelectedKami()} />
        </ModalWrapperFull>
      );
    }
  );
}