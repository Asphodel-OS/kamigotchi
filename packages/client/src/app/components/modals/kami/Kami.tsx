import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { getAccount } from 'app/cache/account';
import { getKami, getKamiAccount } from 'app/cache/kami';
import { getNodeByIndex } from 'app/cache/node';
import {
  getHolderSkillTreePoints,
  getSkillByIndex,
  getSkillTreePointsRequirement,
  getSkillUpgradeError,
  parseSkillRequirementText,
} from 'app/cache/skills';
import { ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useNetwork, useSelected, useVisibility } from 'app/stores';
import { ONYX_INDEX } from 'constants/items';
import { BaseAccount, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { Condition } from 'network/shapes/Conditional';
import { getItemBalance, getItemByIndex } from 'network/shapes/Item';
import { calcKamiExpRequirement, Kami, queryKamis } from 'network/shapes/Kami';
import { Skill } from 'network/shapes/Skill';
import { getCompAddr } from 'network/shapes/utils';
import { Battles } from './battles/Battles';
import { Header } from './header/Header';
import { Tabs } from './header/Tabs';
import { Skills } from './skills/Skills';
import { Traits } from './traits/Traits';

const SYNC_TIME = 1000;
export type TabType = 'TRAITS' | 'SKILLS' | 'BATTLES';

export const KamiModal: UIComponent = {
  id: 'KamiModal',
  requirement: (layers) => {
    const { network } = layers;
    const { world, components } = network;

    return interval(SYNC_TIME).pipe(
      map(() => {
        const accountEntity = queryAccountFromEmbedded(network);
        const account = getAccount(world, components, accountEntity, { live: 2 });
        const kamiOptions = {
          live: 2,
          progress: 2,
          skills: 2,
          stats: 2,
          base: 5,
          flags: 10,
          battles: 30,
          traits: 3600,
        };

        return {
          network,
          data: {
            account,
            onyxItem: getItemByIndex(world, components, ONYX_INDEX),
            spender: getCompAddr(world, components, 'component.token.allowance'),
          },
          utils: {
            calcExpRequirement: (lvl: number) => calcKamiExpRequirement(world, components, lvl),
            getItemBalance: (index: number) => getItemBalance(world, components, account.id, index),
            getAccountByID: (id: EntityID) =>
              getAccount(world, components, world.entityToIndex.get(id) as EntityIndex),
            getKami: (entity: EntityIndex) => getKami(world, components, entity, kamiOptions),
            getKamiByID: (id: EntityID) =>
              getKami(world, components, world.entityToIndex.get(id) as EntityIndex, kamiOptions),
            getOwner: (entity: EntityIndex) => getKamiAccount(world, components, entity),
            getSkill: (index: number) => getSkillByIndex(world, components, index),
            getSkillUpgradeError: (index: number, kami: Kami) =>
              getSkillUpgradeError(world, components, index, kami),
            getTreePoints: (tree: string, holderID: EntityID) =>
              getHolderSkillTreePoints(world, components, tree, holderID),
            getTreeRequirement: (skill: Skill) =>
              getSkillTreePointsRequirement(world, components, skill),
            queryKamiByIndex: (index: number) => queryKamis(components, { index })[0],
            parseSkillRequirement: (requirement: Condition) =>
              parseSkillRequirementText(world, components, requirement),
            getEntityIndex: (entity: EntityID) => world.entityToIndex.get(entity)!,
            getNodeByIndex: (index: number) => getNodeByIndex(world, components, index),
          },
        };
      })
    );
  },
  Render: ({ data, network, utils }) => {
    const { actions, api } = network;
    const { account, onyxItem, spender } = data;
    const { getKami, getOwner, queryKamiByIndex, getSkillUpgradeError, getTreePoints } = utils;
    const kamiIndex = useSelected((s) => s.kamiIndex);
    const { selectedAddress, apis: ownerAPIs } = useNetwork();
    const kamiModalOpen = useVisibility((s) => s.modals.kami);
    const accountModalOpen = useVisibility((s) => s.modals.account);

    const [tab, setTab] = useState<TabType>('TRAITS');
    const [kami, setKami] = useState<Kami>();
    const [owner, setOwner] = useState<BaseAccount>(NullAccount);
    const [tick, setTick] = useState(Date.now());

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
      if (!kamiModalOpen) return;
      const kamiEntity = queryKamiByIndex(kamiIndex);
      const newKami = getKami(kamiEntity);
      setKami(newKami);

      const newOwner = getOwner(kamiEntity);
      if (newOwner.index != owner.index) setOwner(newOwner);
    }, [kamiIndex, tick]);

    const positionOverride = () =>
      accountModalOpen
        ? {
            colStart: 32,
            colEnd: 88,
            rowStart: 7,
            rowEnd: 98,
            position: 'absolute' as const,
          }
        : undefined;

    /////////////////
    // ACTIONS

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

    const onyxRespecSkill = (kami: Kami) => {
      const api = ownerAPIs.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      const actionIndex = actions.add({
        action: 'SkillRespec',
        params: [kami.id],
        description: `Respecing skills for ${kami.name}`,
        execute: async () => {
          return api.pet.onyx.respec(kami.id);
        },
      });
    };

    const onyxApprove = (price: number) => {
      const api = ownerAPIs.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      actions.add({
        action: 'Approve token',
        params: [onyxItem.address, spender, price],
        description: `Approve ${price} ${onyxItem.name} to be spent`,
        execute: async () => {
          return api.erc20.approve(onyxItem.address!, spender, price);
        },
      });
    };

    /////////////////
    // DISPLAY

    if (!kami) return <></>;
    return (
      <ModalWrapper
        id='kami'
        positionOverride={positionOverride()}
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
            actions={{
              upgrade: (skill: Skill) => upgradeSkill(kami, skill),
              reset: resetSkill,
              onyxApprove,
              onyxRespec: onyxRespecSkill,
            }}
            state={{ tick }}
            utils={{
              ...utils,
              getUpgradeError: (index: number) => getSkillUpgradeError(index, kami),
              getTreePoints: (tree: string) => getTreePoints(tree, kami.id),
            }}
          />
        )}
        {tab === 'BATTLES' && <Battles kami={kami} setKami={setKami} tab={tab} utils={utils} />}
      </ModalWrapper>
    );
  },
};
