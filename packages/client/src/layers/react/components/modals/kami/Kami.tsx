import React, { useState } from 'react';
import { map, merge } from 'rxjs';
import { EntityID } from '@latticexyz/recs';

import { Banner } from './Banner';
import { KillLogs } from './KillLogs';
import { Traits } from './Traits';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { Kami, getKami } from 'layers/react/shapes/Kami';
import { dataStore } from 'layers/react/store/createStore';
import { Skills } from './Skills';
import { getRegistrySkills } from 'layers/react/shapes/Skill';

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
            IsEffect,
            IsKill,
            IsPet,
            IsRequirement,
            IsSkill,
            Level,
            MediaURI,
            Name,
            PetID,
            SkillIndex,
            SkillPoint,
            SourceID,
            TargetID,
          },
        },
      } = layers;
      return merge(
        Balance.update$,
        Experience.update$,
        IsEffect.update$,
        IsKill.update$,
        IsPet.update$,
        IsRequirement.update$,
        IsSkill.update$,
        Level.update$,
        MediaURI.update$,
        Name.update$,
        PetID.update$,
        SkillIndex.update$,
        SkillPoint.update$,
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
      const [mode, setMode] = useState('DETAILS');

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
            skills: true,
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

      const upgradeSkill = (kami: Kami, skillIndex: number) => {
        const actionID = `Upgrading skill ` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.skill.upgrade(kami.id, skillIndex);
          },
        })
      }

      const toggleSkills = () => {
        setMode(mode === 'DETAILS' ? 'SKILLS' : 'DETAILS');
      }


      /////////////////
      // DISPLAY

      return (
        <ModalWrapperFull
          divName='kami'
          id='kamiModal'
          header={<Banner kami={getSelectedKami()} actions={{ levelUp, toggleSkills }}></Banner>}
          canExit
          overlay
        >
          {(mode === 'DETAILS')
            ? <>
              <Traits kami={getSelectedKami()} />
              <KillLogs kami={getSelectedKami()} />
            </>
            : <Skills
              skills={getRegistrySkills(layers)}
              kami={getSelectedKami()}
              actions={{ upgrade: upgradeSkill }}
            />
          }
        </ModalWrapperFull>
      );
    }
  );
}