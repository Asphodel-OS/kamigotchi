import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected } from 'app/stores';
import { getAccountFromBurner } from 'network/shapes/Account';
import { Kami, getKamiByIndex } from 'network/shapes/Kami';
import {
  Skill,
  getRegistrySkills,
  getSkillUpgradeError,
  getTreePoints,
  getTreePointsRequirement,
} from 'network/shapes/Skill';
import { waitForActionCompletion } from 'network/utils';
import { Banner } from './banner/Banner';
import { Tabs } from './banner/Tabs';
import { KillLogs } from './battles/KillLogs';
import { Skills } from './skills/Skills';
import { Traits } from './traits/Traits';

export function registerKamiModal() {
  registerUIComponent(
    'KamiDetails',
    {
      colStart: 11,
      colEnd: 67,
      rowStart: 8,
      rowEnd: 99,
    },

    // Requirement
    (layers) => {
      const { network } = layers;
      return interval(5000).pipe(
        map(() => {
          const account = getAccountFromBurner(network, { kamis: true });
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
      const [kami, setKami] = useState<Kami>();

      /////////////////
      // SUBSCRIPTION

      // ticking kami data updaes every second
      useEffect(() => {
        const updateKami = () => {
          setKami(getSelectedKami(kamiIndex));
        };

        updateKami();
        const timerId = setInterval(updateKami, 1000);
        return function cleanup() {
          clearInterval(timerId);
        };
      }, [kamiIndex]);

      /////////////////
      // DATA FETCHING

      const getSelectedKami = (index: number) => {
        return getKamiByIndex(world, components, index, {
          account: true,
          deaths: true,
          kills: true,
          skills: true,
          traits: true,
        });
      };

      /////////////////
      // ACTION

      // awaits the result of an action and then updates the kami data
      const updateKamiAfterAction = async (actionIndex: EntityIndex) => {
        await waitForActionCompletion(actions!.Action, actionIndex);
        setKami(getSelectedKami(kamiIndex));
      };

      const levelUp = (kami: Kami) => {
        const actionIndex = actions.add({
          action: 'KamiLevel',
          params: [kami.id],
          description: `Leveling up ${kami.name}`,
          execute: async () => {
            return api.player.pet.level(kami.id);
          },
        });
        // updateKamiAfterAction(actionIndex);
      };

      const upgradeSkill = (kami: Kami, skill: Skill) => {
        const actionIndex = actions.add({
          action: 'SkillUpgrade',
          params: [kami.id, skill.index],
          description: `Upgrading ${skill.name} for ${kami.name}`,
          execute: async () => {
            return api.player.skill.upgrade(kami.id, skill.index);
          },
        });
        // updateKamiAfterAction(actionIndex);
      };

      /////////////////
      // DISPLAY

      if (!kami) return <></>;
      return (
        <ModalWrapper
          id='kami'
          header={[
            <Banner key='banner' data={{ account, kami: kami }} actions={{ levelUp }} />,
            <Tabs key='tabs' tab={tab} setTab={setTab} />,
          ]}
          canExit
          overlay
          noPadding
        >
          {tab === 'battles' && <KillLogs kami={kami} />}
          {tab === 'traits' && <Traits kami={kami} />}
          {tab === 'skills' && (
            <Skills
              account={account}
              kami={kami}
              skills={getRegistrySkills(world, components)}
              actions={{ upgrade: (skill: Skill) => upgradeSkill(kami, skill) }}
              utils={{
                getUpgradeError: (index: number, registry: Map<number, Skill>) =>
                  getSkillUpgradeError(world, components, index, kami, registry),
                getTreePoints: (tree: string) => getTreePoints(world, components, kami, tree),
                getTreeRequirement: (skill: Skill) =>
                  getTreePointsRequirement(world, components, skill),
              }}
            />
          )}
        </ModalWrapper>
      );
    }
  );
}
