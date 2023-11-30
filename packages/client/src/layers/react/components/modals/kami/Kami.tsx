import React, { useState } from 'react';
import { map, merge } from 'rxjs';
import { EntityID } from '@latticexyz/recs';
import crypto from "crypto";

import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { Kami, getKami } from 'layers/react/shapes/Kami/Kami';
import { Skill, getRegistrySkills } from 'layers/react/shapes/Skill';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';
import { Banner } from './Banner';
import { KillLogs } from './KillLogs';
import { Skills } from './Skills';
import { Tabs } from './Tabs';
import { Traits } from './Traits';


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
            IsBonus,
            IsEffect,
            IsKill,
            IsPet,
            IsRequirement,
            IsSkill,
            HolderID,
            SourceID,
            TargetID,
            Balance,
            Experience,
            Harmony,
            Health,
            Level,
            MediaURI,
            Name,
            PetID,
            Power,
            SkillIndex,
            SkillPoint,
            Slots,
            Type,
            Violence,
          },
        },
      } = layers;
      return merge(
        IsBonus.update$,
        IsEffect.update$,
        IsKill.update$,
        IsPet.update$,
        IsRequirement.update$,
        IsSkill.update$,
        HolderID.update$,
        SourceID.update$,
        TargetID.update$,
        Balance.update$,
        Experience.update$,
        Harmony.update$,
        Health.update$,
        Level.update$,
        MediaURI.update$,
        Name.update$,
        PetID.update$,
        Power.update$,
        SkillIndex.update$,
        SkillPoint.update$,
        Slots.update$,
        Type.update$,
        Violence.update$,
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
      const [tab, setTab] = useState('traits');
      const { kamiEntityIndex } = useSelectedEntities();
      const [mode, setMode] = useState('DETAILS');

      /////////////////
      // DATA FETCHING

      const getSelectedKami = () => {
        return getKami(
          layers,
          kamiEntityIndex,
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
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'KamiLevel',
          params: [kami.id],
          description: `Leveling up ${kami.name}`,
          execute: async () => {
            return api.pet.level(kami.id);
          },
        })
      }

      const upgradeSkill = (kami: Kami, skill: Skill) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'SkillUpgrade',
          params: [kami.id, skill.index],
          description: `Upgrading ${skill.name} for ${kami.name}`,
          execute: async () => {
            return api.skill.upgrade(kami.id, skill.index);
          },
        })
      }

      const toggleSkills = () => {
        setMode(mode === 'DETAILS' ? 'SKILLS' : 'DETAILS');
      }

      const Content = () => {
        if (tab === 'traits') {
          return <Traits kami={getSelectedKami()} />
        } else if (tab === 'skills') {
          return (
            <Skills
              skills={getRegistrySkills(layers)}
              kami={getSelectedKami()}
              actions={{ upgrade: upgradeSkill }}
            />
          );
        } else if (tab === 'battles') {
          return <KillLogs kami={getSelectedKami()} />
        }
      }

      /////////////////
      // DISPLAY

      return (
        <ModalWrapperFull
          divName='kami'
          id='kamiModal'
          header={[
            <Banner
              key='banner'
              kami={getSelectedKami()}
              actions={{ levelUp, toggleSkills }}
            />,
            <Tabs key='tabs' tab={tab} setTab={setTab} />
          ]}
          canExit
          overlay
        >
          {Content()}
        </ModalWrapperFull>
      );
    }
  );
}