import { EntityID, EntityIndex } from '@mud-classic/recs';
import { QuestsIcon } from 'assets/images/icons/menu';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import { getAccount, getAccountByID } from 'app/cache/account';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import {
  Contribution,
  Goal,
  canClaim,
  canContribute,
  getContributionByHash,
  getContributions,
  getGoalByIndex,
} from 'network/shapes/Goals';
import { Score } from 'network/shapes/Score';
import { getBalance, getDescribedEntity } from 'network/shapes/utils';
import { waitForActionCompletion } from 'network/utils';
import { Details } from './Details';
import { Leaderboard } from './Leaderboard';
import { Progress } from './Progress';
import { Tabs } from './Tabs';

export function registerGoalModal() {
  registerUIComponent(
    'GoalModal',
    {
      colStart: 20,
      colEnd: 80,
      rowStart: 24,
      rowEnd: 78,
    },

    // Requirement
    (layers) => {
      return interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const accountEntity = queryAccountFromEmbedded(network);
          const account = getAccount(world, components, accountEntity, { inventory: 5 });

          return {
            network,
            data: { account },
            utils: {
              canClaim: (goal: Goal, contribution: Contribution) => canClaim(goal, contribution),
              canContribute: (goal: Goal) => canContribute(world, components, goal, account),
              getAccountByID: (id: EntityID) => getAccountByID(world, components, id),
              getBalance: (holder: EntityIndex, index: number | undefined, type: string) =>
                getBalance(world, components, holder, index, type),
              getContribution: (goal: Goal) =>
                getContributionByHash(world, components, goal, account),
              getContributions: (goal: Goal) => getContributions(components, goal.id),
              getDescribedEntity: (type: string, index: number) =>
                getDescribedEntity(world, components, type, index),
            },
          };
        })
      );
    },

    // Render
    ({ network, data, utils }) => {
      const { actions, api, world, components } = network;
      const { account } = data;
      const { canContribute, getContribution, getContributions } = utils;
      const { modals } = useVisibility();
      const { goalIndex } = useSelected(); // only support 1 goal type for now

      const [tab, setTab] = useState('GOAL');
      const [step, setStep] = useState(0);
      const [goal, setGoal] = useState<Goal>();
      const [accContribution, setAccContribution] = useState<Contribution>();
      const [scores, setScores] = useState<Score[]>([]);

      // update details based on selected
      useEffect(() => {
        if (!modals.goal) return;
        const goal = getGoalByIndex(world, components, goalIndex[0]);
        setGoal(goal);

        const accountContribution = getContribution(goal);
        setAccContribution(accountContribution);

        const contributions = getContributions(goal);
        setScores(contributions);
      }, [goalIndex, modals.goal, step, account.coin]);

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

      const MainBox = () => {
        if (goal === undefined) return <Header>Goal not found</Header>;

        return (
          <>
            <Details
              goal={goal}
              getDescribedEntity={(type, index) =>
                getDescribedEntity(world, components, type, index)
              }
            />
            <Progress
              actions={{ contributeTx, claimTx }}
              account={account}
              accContribution={accContribution}
              goal={goal}
              utils={{
                ...utils,
                canContribute: () => canContribute(goal),
                canClaim: () => canClaim(goal, accContribution),
              }}
            />
          </>
        );
      };

      const LeaderboardBox = <Leaderboard scores={scores} utils={utils} />;

      return (
        <ModalWrapper
          id='goal'
          header={<ModalHeader title='Co-op Quest' icon={QuestsIcon} />}
          canExit
          overlay
        >
          <Tabs tab={tab} setTab={setTab} />
          <Content>{tab === 'GOAL' ? MainBox() : LeaderboardBox}</Content>
        </ModalWrapper>
      );
    }
  );
}

const Header = styled.div`
  font-family: Pixel;
  font-size: 1.2vw;
  text-align: flex-start;
  color: black;
  padding: 0 1.5vw;
`;

const Content = styled.div`
  padding: 1vh 0.1vw;
`;
