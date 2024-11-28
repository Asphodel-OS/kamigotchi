import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { BaseAccount, NullAccount, getAccountFromBurner } from 'network/shapes/Account';
import { Kami, getKamiAccount, getKamiBattles, getKamiByIndex } from 'network/shapes/Kami';
import {
  Skill,
  getHolderTreePoints,
  getRegistrySkills,
  getSkillUpgradeError,
  getTreePointsRequirement,
} from 'network/shapes/Skill';
import { waitForActionCompletion } from 'network/utils';
import { Battles } from './battles/Battles';
import { Header } from './header/Header';
import { Tabs } from './header/Tabs';
import { Skills } from './skills/Skills';
import { Traits } from './traits/Traits';

const SYNC_TIME = 1000;

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
          const account = getAccountFromBurner(network);
          return {
            network,
            data: { account },
            utils: {
              getOwner: (index: number) => getKamiAccount(world, components, index),
            },
          };
        })
      );
    },

    // Render
    ({ data, network, utils }) => {
      const { account } = data;
      const { actions, api, components, world } = network;
      const { kamiIndex } = useSelected();
      const { modals } = useVisibility();
      const [tab, setTab] = useState('traits');
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

      // update the Kami Entity whenever the index changes
      useEffect(() => {
        if (kamiIndex == kami?.index) return;
        const newKami = getSelectedKami(kamiIndex);
        setKami(newKami);

        const newOwner = utils.getOwner(kamiIndex);
        if (newOwner.index != owner.index) setOwner(newOwner);
      }, [kamiIndex]);

      // refresh kami data every second
      useEffect(() => {
        if (!modals.kami) return;
        setKami(getSelectedKami(kamiIndex));
      }, [lastSync]);

      /////////////////
      // DATA FETCHING

      const getSelectedKami = (index: number) => {
        return getKamiByIndex(world, components, index, {
          skills: true,
          traits: true,
          flags: true,
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

      const resetSkill = (kami: Kami) => {
        const actionIndex = actions.add({
          action: 'SkillReset',
          params: [kami.id],
          description: `Resetting skills for ${kami.name}`,
          execute: async () => {
            return api.player.skill.reset(kami.id);
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
            <Header key='banner' data={{ account, kami, owner }} actions={{ levelUp }} />,
            <Tabs key='tabs' tab={tab} setTab={setTab} />,
          ]}
          canExit
          overlay
          noPadding
        >
          {tab === 'traits' && <Traits kami={kami} />}
          {tab === 'skills' && (
            <Skills
              data={{ account, kami, owner }}
              skills={getRegistrySkills(world, components)}
              actions={{ upgrade: (skill: Skill) => upgradeSkill(kami, skill), reset: resetSkill }}
              utils={{
                getUpgradeError: (index: number, registry: Map<number, Skill>) =>
                  getSkillUpgradeError(world, components, index, kami, registry),
                getTreePoints: (tree: string) =>
                  getHolderTreePoints(world, components, tree, kami.id),
                getTreeRequirement: (skill: Skill) =>
                  getTreePointsRequirement(world, components, skill),
              }}
            />
          )}
          {tab === 'battles' && (
            <Battles
              kami={kami}
              utils={{
                getBattles: (kami: Kami) => getKamiBattles(world, components, kami.entityIndex),
              }}
            />
          )}
        </ModalWrapper>
      );
    }
  );
}
