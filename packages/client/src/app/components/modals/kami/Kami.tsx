import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected } from 'app/stores';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { Kami, getKamiByIndex } from 'layers/network/shapes/Kami';
import {
  Skill,
  getRegistrySkills,
  getSkillUpgradeError,
  getTreePoints,
} from 'layers/network/shapes/Skill';
import { waitForActionCompletion } from 'layers/network/utils';
import { sleep } from 'utils/misc';
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
      // SUBSCIRPTION

      useEffect(() => {
        setKami(getSelectedKami(kamiIndex));
      }, [kamiIndex]);

      /////////////////
      // DATA FETCHING

      const getSelectedKami = (index: number) => {
        return getKamiByIndex(world, components, index, {
          account: true,
          deaths: true,
          kills: true,
          production: true,
          skills: true,
          traits: true,
        });
      };

      /////////////////
      // ACTION

      // awaits the result of an action and then updates the kami data
      const updateKamiAfterAction = async (actionIndex: EntityIndex) => {
        await waitForActionCompletion(actions!.Action, actionIndex);
        sleep(2000); // the above function is janky so we add a buffer
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
        updateKamiAfterAction(actionIndex);
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
        updateKamiAfterAction(actionIndex);
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
              }}
            />
          )}
        </ModalWrapper>
      );
    }
  );
}
