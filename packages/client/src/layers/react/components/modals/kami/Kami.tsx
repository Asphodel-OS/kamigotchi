import { useState } from 'react';
import { interval, map } from 'rxjs';

import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { Kami, getKamiByIndex } from 'layers/network/shapes/Kami';
import { Skill, getRegistrySkills } from 'layers/network/shapes/Skill';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { useSelected } from 'layers/react/store';
import { KillLogs } from './battles/KillLogs';
import { Banner } from './header/Banner';
import { Tabs } from './header/Tabs';
import { Skills } from './skills/Skills';
import { Traits } from './traits/Traits';

export function registerKamiModal() {
  registerUIComponent(
    'KamiDetails',
    {
      colStart: 25,
      colEnd: 78,
      rowStart: 3,
      rowEnd: 100,
    },

    // Requirement
    (layers) => {
      const { network } = layers;
      return interval(1000).pipe(
        map(() => {
          const account = getAccountFromBurner(network, { inventory: true, kamis: true });
          return {
            network,
            data: { account },
          };
        })
      );
    },

    // Render
    ({ data, network }) => {
      const { account } = data;
      const { actions, api, components, world } = network;
      const { kamiIndex } = useSelected();
      const [tab, setTab] = useState('traits');

      /////////////////
      // DATA FETCHING

      const getSelectedKami = () => {
        return getKamiByIndex(world, components, kamiIndex, {
          account: true,
          deaths: true,
          kills: true,
          production: true,
          skills: true,
          traits: true,
        });
      };

      /////////////////
      // ACTIONS

      const levelUp = (kami: Kami) => {
        actions.add({
          action: 'KamiLevel',
          params: [kami.id],
          description: `Leveling up ${kami.name}`,
          execute: async () => {
            return api.player.pet.level(kami.id);
          },
        });
      };

      const upgradeSkill = (kami: Kami, skill: Skill) => {
        actions.add({
          action: 'SkillUpgrade',
          params: [kami.id, skill.index],
          description: `Upgrading ${skill.name} for ${kami.name}`,
          execute: async () => {
            return api.player.skill.upgrade(kami.id, skill.index);
          },
        });
      };

      /////////////////
      // DISPLAY

      return (
        <ModalWrapper
          divName='kami'
          id='kamiModal'
          header={[
            <Banner
              key='banner'
              data={{ account, kami: getSelectedKami() }}
              actions={{ levelUp }}
            />,
            <Tabs key='tabs' tab={tab} setTab={setTab} />,
          ]}
          canExit
          overlay
          noPadding
        >
          {tab === 'battles' && <KillLogs kami={getSelectedKami()} />}
          {tab === 'traits' && <Traits kami={getSelectedKami()} />}
          {tab === 'skills' && (
            <Skills
              account={account}
              kami={getSelectedKami()}
              skills={getRegistrySkills(world, components)}
              actions={{ upgrade: upgradeSkill }}
            />
          )}
        </ModalWrapper>
      );
    }
  );
}
