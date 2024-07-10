import { EntityID, EntityIndex } from '@mud-classic/recs';
import { questsIcon } from 'assets/images/icons/menu';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { Account, getAccountFromBurner } from 'network/shapes/Account';
import {
  Contribution,
  Goal,
  canClaim,
  canContribute,
  getContributionByHash,
  getContributions,
  getGoalByIndex,
} from 'network/shapes/Goal';
import { Score } from 'network/shapes/Score';
import { getBalance, getDescribedEntity } from 'network/shapes/utils';
import { waitForActionCompletion } from 'network/utils';
import { ActionBar } from './ActionBar';
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
          const account = getAccountFromBurner(network, {
            inventory: true,
          });
          return {
            network,
            data: { account },
          };
        })
      );
    },

    // Render
    ({ network, data }) => {
      const { actions, api, world, components } = network;
      const { modals } = useVisibility();
      const { goalIndex } = useSelected(); // only support 1 goal type for now
      const [currGoal, setCurrGoal] = useState<Goal>();
      const [tab, setTab] = useState('GOAL');
      const [step, setStep] = useState(0);
      const [accContribution, setAccContribution] = useState<Contribution>();
      const [scores, setScores] = useState<Score[]>([]);

      // update details based on selected
      useEffect(() => {
        if (modals.goal) {
          // only 1 goal type for now, potentially support multiple in the future
          const goal = getGoalByIndex(world, components, goalIndex[0]);
          const accCon = getContributionByHash(world, components, goal, data.account);
          setCurrGoal(goal);
          setAccContribution(accCon);

          setScores(getContributions(world, components, goal.id));
        }
      }, [goalIndex, modals.goal, step, data.account.coin]);

      /////////////////
      // INTERACTIONS

      const contributeTx = async (index: number, amount: number) => {
        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'Contributing to goal',
          params: [index, amount],
          description: `Contributing ${amount} to  goal ${index}`,
          execute: async () => {
            return api.player.goal.contribute(index, amount);
          },
        });

        await waitForActionCompletion(
          actions!.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
        setStep(step + 1);
      };

      const claimTx = async (index: number) => {
        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'Claiming reward',
          params: [index],
          description: `Claiming reward for goal ${index}`,
          execute: async () => {
            return api.player.goal.claim(index);
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
        if (currGoal === undefined) return <Header>Goal not found</Header>;

        return (
          <>
            <Details
              goal={currGoal}
              getDescribedEntity={(type, index) =>
                getDescribedEntity(world, components, type, index)
              }
            />
            <Progress
              goal={currGoal}
              accContribution={accContribution!}
              getDescribedEntity={(type, index) =>
                getDescribedEntity(world, components, type, index)
              }
            />
            <ActionBar
              actions={{ contributeTx, claimTx }}
              account={data.account}
              contribution={accContribution}
              goal={currGoal}
              utils={{
                canContribute: () => canContribute(world, components, currGoal, data.account),
                canClaim: () => canClaim(currGoal, accContribution),
                getBalance: (holder: Account, index: number | undefined, type: string) =>
                  getBalance(world, components, holder, index, type),
                getDescribedEntity: (type: string, index: number) =>
                  getDescribedEntity(world, components, type, index),
              }}
            />
          </>
        );
      };

      const LeaderboardBox = <Leaderboard data={scores} />;

      return (
        <ModalWrapper
          id='goal'
          header={<ModalHeader title='Collaborative Quest' icon={questsIcon} />}
          canExit
          overlay
        >
          <Tabs tab={tab} setTab={setTab} />
          {tab === 'GOAL' ? MainBox() : LeaderboardBox}
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
