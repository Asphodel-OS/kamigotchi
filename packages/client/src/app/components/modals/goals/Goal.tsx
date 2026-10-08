import { QuestsIcon } from 'assets/images/icons/menu';
import { EntityID, EntityIndex } from 'engine/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import { getAccountByID as _getAccountByID, getAccount } from 'app/cache/account';
import { ModalWrapper } from 'app/components/library';
import { Palette, SegmentedTabs } from 'app/components/library/pastel';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useSelected, useVisibility } from 'app/stores';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import {
  Contribution,
  Goal,
  canContribute as _canContribute,
  getContributions as _getContributions,
  canClaim,
  getContributionByHash,
  getGoalByIndex,
} from 'network/shapes/Goals';
import { Score } from 'network/shapes/Score';
import { getBalance, getFromDescription } from 'network/shapes/utils';
import { waitForActionCompletion } from 'network/utils';
import { Details } from './Details';
import { Leaderboard } from './Leaderboard';
import { Progress } from './Progress';

export const GoalModal: UIComponent = {
  id: 'GoalModal',
  Render: () => {
    const layers = useLayers();

    const { network, data, utils } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);
      const account = getAccount(world, components, accountEntity, { inventory: 5 });

      return {
        network,
        data: { account },
        utils: {
          canClaim: (goal: Goal, contribution: Contribution) => canClaim(goal, contribution),
          canContribute: (goal: Goal) => _canContribute(world, components, goal, account),
          getAccountByID: (id: EntityID) => _getAccountByID(world, components, id),
          getBalance: (holder: EntityIndex, index: number | undefined, type: string) =>
            getBalance(world, components, holder, index, type),
          getContribution: (goal: Goal) => getContributionByHash(world, components, goal, account),
          getContributions: (goal: Goal) => _getContributions(components, goal.id),
          getFromDescription: (type: string, index: number) =>
            getFromDescription(world, components, type, index),
        },
      };
    })();

    const { actions, api, world, components } = network;
    const { account } = data;
    const { canContribute, getContribution, getContributions } = utils;
    const goalModalOpen = useVisibility((s) => s.modals.goal);
    const goalIndex = useSelected((s) => s.goalIndex); // only support 1 goal type for now

    const [tab, setTab] = useState('GOAL');
    const [step, setStep] = useState(0);
    const [goal, setGoal] = useState<Goal>();
    const [accContribution, setAccContribution] = useState<Contribution>();
    const [scores, setScores] = useState<Score[]>([]);
    const [tick, setTick] = useState(0);

    // update details based on selected
    useEffect(() => {
      if (!goalModalOpen) return;
      const goal = getGoalByIndex(world, components, goalIndex[0]);
      setGoal(goal);

      const accountContribution = getContribution(goal);
      setAccContribution(accountContribution);

      const contributions = getContributions(goal);
      setScores(contributions);
    }, [goalIndex, goalModalOpen, step, tick, account.coin]);

    // refresh when the co-op is paused or resumed while open
    useEffect(() => {
      if (!goalModalOpen || !goal) return;
      const sub = components.IsDisabled.update$.subscribe(({ entity }) => {
        if (world.entities[entity] === goal.id) setTick((t) => t + 1);
      });
      return () => sub.unsubscribe();
    }, [goalModalOpen, goal?.id]);

    /////////////////
    // INTERACTIONS

    const contributeTx = async (goal: Goal, amount: number) => {
      const actionID = uuid() as EntityID;
      actions.add({
        id: actionID,
        action: 'Contributing to goal',
        params: [goal.index, amount],
        description: `Contributing ${amount} to  goal [${goal.name}]`,
        execute: async () => {
          return api.player.goal.contribute(goal.index, amount);
        },
      });

      await waitForActionCompletion(
        actions!.Action,
        world.entityToIndex.get(actionID) as EntityIndex
      );
      setStep(step + 1);
    };

    const claimTx = async (goal: Goal) => {
      const actionID = uuid() as EntityID;
      actions.add({
        id: actionID,
        action: 'Claiming reward',
        params: [goal.index],
        description: `Claiming reward for goal [${goal.name}]`,
        execute: async () => {
          return api.player.goal.claim(goal.index);
        },
      });

      await waitForActionCompletion(
        actions!.Action,
        world.entityToIndex.get(actionID) as EntityIndex
      );
      setStep(step + 1);
    };

    /////////////////
    // DISPLAY

    const unit = goal
      ? getFromDescription(
          world,
          components,
          goal.objective.target.type,
          goal.objective.target.index ?? 0
        ).name
      : '';

    const TopBar = (
      <Top>
        <TopIcon src={QuestsIcon} alt='Co-op Quest' />
        <TopText>
          <Kicker>Co-op Quest{goal?.disabled ? '  (paused)' : ''}</Kicker>
          <Title>{goal?.name ?? 'Goal not found'}</Title>
        </TopText>
        <SegmentedTabs
          tab={tab}
          setTab={setTab}
          options={[
            { key: 'GOAL', label: 'Goal' },
            { key: 'LEADERBOARD', label: 'Leaderboard' },
          ]}
        />
      </Top>
    );

    const Footer =
      tab === 'GOAL' && goal ? (
        <Progress
          actions={{ contributeTx, claimTx }}
          account={account}
          accContribution={accContribution}
          goal={goal}
          unit={unit}
          utils={{
            ...utils,
            canContribute: () => canContribute(goal),
            canClaim: () => canClaim(goal, accContribution),
          }}
        />
      ) : undefined;

    const Body = () => {
      if (goal === undefined) return <Empty>Goal not found</Empty>;
      if (tab === 'LEADERBOARD')
        return <Leaderboard scores={scores} myID={account.id} unit={unit} utils={utils} />;
      return (
        <Details
          goal={goal}
          accContribution={accContribution}
          unit={unit}
          getFromDescription={(type, index) => getFromDescription(world, components, type, index)}
        />
      );
    };

    return (
      <ModalWrapper
        id='goal'
        header={TopBar}
        footer={Footer}
        canExit
        overlay
        noPadding
        showScrollBar
      >
        <Content>{Body()}</Content>
      </ModalWrapper>
    );
  },
};

const Top = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8vw;
  padding: 0.7vw 3.6vw 0.7vw 1.2vw;
  user-select: none;
`;

const TopIcon = styled.img`
  width: 2.2vw;
  height: 2.2vw;
  user-drag: none;
`;

const TopText = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3vw;
  min-width: 0;
`;

const Kicker = styled.span`
  font-family: Pixel;
  font-size: 0.55vw;
  text-transform: uppercase;
  letter-spacing: 0.06vw;
  color: ${Palette.faint};
`;

const Title = styled.span`
  font-family: Pixel;
  font-size: 1.15vw;
  color: ${Palette.ink};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Content = styled.div`
  padding-top: 1vw;
`;

const Empty = styled.div`
  padding: 3vw 1.4vw;
  text-align: center;
  font-family: Pixel;
  font-size: 0.8vw;
  color: ${Palette.muted};
`;
