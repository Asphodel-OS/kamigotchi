import { useState } from 'react';
import styled from 'styled-components';

import { ActionButton, InputSingleNumberForm } from 'app/components/library';
import { Account } from 'layers/network/shapes/Account';
import { Contribution, Goal } from 'layers/network/shapes/Goal';
import { DetailedEntity } from 'layers/network/shapes/utils/EntityTypes';

interface Props {
  actions: {
    contributeTx: (index: number, amount: number) => void;
    claimTx: (index: number) => void;
  };
  account: Account;
  contribution: Contribution | undefined;
  goal: Goal;
  utils: {
    canContribute: () => [boolean, string];
    canClaim: () => [boolean, string];
    getBalance: (holder: Account, index: number | undefined, type: string) => number;
    getDescribedEntity: (type: string, index: number) => DetailedEntity;
  };
}

export const ActionBar = (props: Props) => {
  const { actions, account, contribution, goal, utils } = props;

  const [contributeAmount, setContributeAmount] = useState(0);

  const accBalance = () => {
    return utils.getBalance(account, goal.objective.target.index, goal.objective.target.type);
  };

  const maxAmt = () => {
    const goalLeft = goal.objective.target.value ?? 0 - goal.currBalance;
    return Math.min(accBalance(), goalLeft);
  };

  const txContribute = () => {
    const max = maxAmt();
    if (contributeAmount > max) setContributeAmount(max);
    actions.contributeTx(goal.index, contributeAmount);
  };

  const txClaim = () => {
    actions.claimTx(goal.index);
  };

  ////////////////////
  // DISPLAY

  const Contributer = () => {
    const [canDo, errorText] = utils.canContribute();

    return (
      <div>
        <InputSingleNumberForm
          id='contribute-stepper'
          bounds={{
            min: 0,
            max: maxAmt(),
            step: 1,
          }}
          onSubmit={txContribute}
          watch={setContributeAmount}
          disabled={!canDo}
          tooltip={!canDo ? [errorText] : undefined}
          hasButton
          buttonText='Contribute'
        />
        <SubText>
          Contribute{' '}
          {
            utils.getDescribedEntity(goal.objective.target.type, goal.objective.target.index ?? 0)
              .name
          }
          ?
        </SubText>
        <SubText>You have {accBalance()} available.</SubText>
      </div>
    );
  };

  const Claimer = () => {
    const [canDo, errorText] = utils.canClaim();

    return (
      <Column>
        <ActionButton
          onClick={txClaim}
          text='Claim'
          size='large'
          disabled={!canDo}
          tooltip={!canDo ? [errorText] : undefined}
        />
        <SubText>Receive completion rewards</SubText>
      </Column>
    );
  };

  return <Container>{goal.complete ? Claimer() : Contributer()}</Container>;
};

const Container = styled.div`
  margin: 2vh 1vw;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SubText = styled.h2`
  font-size: 0.8vw;
  font-family: Pixel;
  text-align: center;
  color: #666;

  padding: 1vh 1vw 0;
`;
