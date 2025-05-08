import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { getAccount } from 'app/cache/account';
import { getKami, getKamiAccount } from 'app/cache/kami';
import {
  getHolderSkillTreePoints,
  getSkillByIndex,
  getSkillTreePointsRequirement,
  getSkillUpgradeError,
  initializeSkills,
  parseSkillRequirementText,
} from 'app/cache/skills';
import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { BaseAccount, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { Condition } from 'network/shapes/Conditional';
import { calcKamiExpRequirement, Kami, queryKamis } from 'network/shapes/Kami';
import { Skill } from 'network/shapes/Skill';
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
            progress: 2,
            skills: 2,
            stats: 2,
            traits: 3600,
          };

          return {
            network,
            data: { account },
            utils: {
              calcExpRequirement: (lvl: number) => calcKamiExpRequirement(world, components, lvl),
              getKami: (entity: EntityIndex) => getKami(world, components, entity, kamiOptions),
              getOwner: (entity: EntityIndex) => getKamiAccount(world, components, entity),
              getSkill: (index: number) => getSkillByIndex(world, components, index),
              getSkillUpgradeError: (index: number, kami: Kami) =>
                getSkillUpgradeError(world, components, index, kami),
              getTreePoints: (tree: string, holderID: EntityID) =>
                getHolderSkillTreePoints(world, components, tree, holderID),
              getTreeRequirement: (skill: Skill) =>
                getSkillTreePointsRequirement(world, components, skill),
              initializeSkills: () => initializeSkills(world, components),
              queryKamiByIndex: (index: number) => queryKamis(components, { index })[0],
              parseSkillRequirement: (requirement: Condition) =>
                parseSkillRequirementText(world, components, requirement),
            },
          };
        })
      );
    },

    // Render
    ({ data, network, utils }) => {
      const { actions, api } = network;
      const { account } = data;
      const { getKami, getOwner, queryKamiByIndex, getSkillUpgradeError, getTreePoints } = utils;
      const { kamiIndex } = useSelected();
      const { modals } = useVisibility();

      const [tab, setTab] = useState<TabType>('TRAITS');
      const [kami, setKami] = useState<Kami>();
      const [owner, setOwner] = useState<BaseAccount>(NullAccount);
      const [tick, setTick] = useState(Date.now());

      // initialize skills on load
      // TODO: move this to a more appropriate place
      useEffect(() => {
        utils.initializeSkills();
      }, []);

      /////////////////
      // SUBSCRIPTIONS

      // time trigger to use for periodic refreshes
      useEffect(() => {
        const updateSync = () => setTick(Date.now());
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
      }, [kamiIndex, tick]);

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
            return api.player.pet.skill.upgrade(kami.id, skill.index);
          },
        });
      };

      const resetSkill = (kami: Kami) => {
        const actionIndex = actions.add({
          action: 'SkillReset',
          params: [kami.id],
          description: `Resetting skills for ${kami.name}`,
          execute: async () => {
            return api.player.pet.skill.reset(kami.id);
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
              actions={{ upgrade: (skill: Skill) => upgradeSkill(kami, skill), reset: resetSkill }}
              state={{ tick }}
              utils={{
                ...utils,
                getUpgradeError: (index: number) => getSkillUpgradeError(index, kami),
                getTreePoints: (tree: string) => getTreePoints(tree, kami.id),
              }}
            />
          )}
          {tab === 'BATTLES' && <Battles kami={kami} tab={tab} />}
        </ModalWrapper>
      );
    }
  );
}
