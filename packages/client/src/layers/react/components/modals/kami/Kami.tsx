import React, { useState } from 'react';
import { interval, map } from 'rxjs';
import { EntityID } from '@latticexyz/recs';
import crypto from "crypto";

import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { Kami, getKamiByIndex } from 'layers/network/shapes/Kami';
import { Skill, getRegistrySkills } from 'layers/network/shapes/Skill';
import { useSelected } from 'layers/react/store/selected';
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

    // Requirement
    (layers) => interval(1000).pipe(map(() => {
      return { network: layers.network };
    })),

    // Render
    ({ network }) => {
      const { actions, api } = network;
      const [tab, setTab] = useState('traits');
      const { kamiIndex } = useSelected();
      const [mode, setMode] = useState('DETAILS');

      /////////////////
      // DATA FETCHING

      const getSelectedKami = () => {
        return getKamiByIndex(
          network,
          kamiIndex,
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
            return api.player.pet.level(kami.id);
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
            return api.player.skill.upgrade(kami.id, skill.index);
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
              skills={getRegistrySkills(network)}
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
        <ModalWrapper
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
        </ModalWrapper>
      );
    }
  );
}