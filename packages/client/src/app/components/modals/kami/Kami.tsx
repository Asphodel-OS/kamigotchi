import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { getAccount } from 'app/cache/account';
import { getKami, getKamiAccount } from 'app/cache/kami';
import {
  getHolderSkillTreePoints,
  getSkillTreePointsRequirement,
  getSkillUpgradeError,
} from 'app/cache/skill';
import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { BaseAccount, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { Kami, calcKamiExpRequirement, queryKamis } from 'network/shapes/Kami';
import { Skill, getRegistrySkills } from 'network/shapes/Skill';
import { Battles } from './battles/Battles';
import { Header } from './header/Header';
import { Tabs } from './header/Tabs';
import { Skills } from './skills/Skills';
import { Traits } from './traits/Traits';

const SYNC_TIME = 1000;
export type TabType = 'TRAITS' | 'SKILLS' | 'BATTLES';

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
      const { world, components } = network;

      return interval(SYNC_TIME).pipe(
        map(() => {
          const accountEntity = queryAccountFromEmbedded(network);
          const account = getAccount(world, components, accountEntity, { live: 2 });
          const kamiOptions = {
            live: 2,
            battles: 30,
            flags: 10,
            progress: 5,
            skills: 2,
            stats: 5,
            traits: 3600,
          };

          return {
            network,
            data: { account },
            utils: {
              calcExpRequirement: (lvl: number) => calcKamiExpRequirement(world, components, lvl),
              getKami: (entity: EntityIndex) => getKami(world, components, entity, kamiOptions),
              getOwner: (entity: EntityIndex) => getKamiAccount(world, components, entity),
              getUpgradeError: (registry: Map<number, Skill>, index: number, kami: Kami) =>
                getSkillUpgradeError(world, components, index, kami, registry),
              getTreePoints: (tree: string, holderID: EntityID) =>
                getHolderSkillTreePoints(world, components, tree, holderID),
              getTreeRequirement: (skill: Skill) =>
                getSkillTreePointsRequirement(world, components, skill),
              queryKamiByIndex: (index: number) => queryKamis(components, { index })[0],
            },
          };
        })
      );
    },

    // Render
    ({ data, network, utils }) => {
      const { actions, api, components, world } = network;
      const { account } = data;
      const {
        getKami,
        getOwner,
        queryKamiByIndex,
        getUpgradeError,
        getTreePoints,
        getTreeRequirement,
      } = utils;
      const { kamiIndex } = useSelected();
      const { modals } = useVisibility();

      const [tab, setTab] = useState<TabType>('TRAITS');
      const [kami, setKami] = useState<Kami>();
      const [owner, setOwner] = useState<BaseAccount>(NullAccount);
      const [lastSync, setLastSync] = useState(Date.now());

      /////////////////
      // SUBSCRIPTIONS

      // time trigger to use for periodic refreshes
      useEffect(() => {
        const updateSync = () => setLastSync(Date.now());
        const timerId = setInterval(updateSync, SYNC_TIME);
        return () => clearInterval(timerId);
      }, []);

      // update the Kami Object whenever the index changes or on each cycle
      useEffect(() => {
        if (!modals.kami) return;
        const kamiEntity = queryKamiByIndex(kamiIndex);
        const newKami = getKami(kamiEntity);
        setKami(newKami);

        const newOwner = getOwner(kamiEntity);
        if (newOwner.index != owner.index) setOwner(newOwner);
      }, [kamiIndex, lastSync]);

      /////////////////
      // DATA FETCHING

      const getSelectedKami = (index: number) => {};

      /////////////////
      // ACTION

      const levelUp = (kami: Kami) => {
        const actionIndex = actions.add({
          action: 'KamiLevel',
          params: [kami.id],
          description: `Leveling up ${kami.name}`,
          execute: async () => {
            return api.player.pet.level(kami.id);
          },
        });
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
      };

      const resetSkill = (kami: Kami) => {
        const actionIndex = actions.add({
          action: 'SkillReset',
          params: [kami.id],
          description: `Resetting skills for ${kami.name}`,
          execute: async () => {
            return api.player.skill.reset(kami.id);
          },
        });
      };

      /////////////////
      // DISPLAY

      if (!kami) return <></>;
      return (
        <ModalWrapper
          id='kami'
          header={[
            <Header
              key='banner'
              data={{ account, kami, owner }}
              actions={{ levelUp }}
              utils={utils}
            />,
            <Tabs key='tabs' tab={tab} setTab={setTab} />,
          ]}
          canExit
          overlay
          noPadding
        >
          {tab === 'TRAITS' && <Traits kami={kami} />}
          {tab === 'SKILLS' && (
            <Skills
              data={{ account, kami, owner }}
              skills={getRegistrySkills(world, components)}
              actions={{ upgrade: (skill: Skill) => upgradeSkill(kami, skill), reset: resetSkill }}
              utils={{
                getUpgradeError: (registry: Map<number, Skill>, index: number) =>
                  getUpgradeError(registry, index, kami),
                getTreePoints: (tree: string) => getTreePoints(tree, kami.id),
                getTreeRequirement,
              }}
            />
          )}
          {tab === 'BATTLES' && <Battles kami={kami} tab={tab} />}
        </ModalWrapper>
      );
    }
  );
}
