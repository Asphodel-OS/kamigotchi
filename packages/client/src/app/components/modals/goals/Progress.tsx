import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { ProgressBar } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { Contribution, Goal } from 'network/shapes/Goal';
import { DetailedEntity } from 'network/shapes/utils/EntityTypes';
import { parseQuantity } from 'network/shapes/utils/parse';
import { ActionBar } from './ActionBar';

interface Props {
  actions: {
    contributeTx: (index: number, amount: number) => void;
    claimTx: (index: number) => void;
  };
  account: Account;
  accContribution: Contribution | undefined;
  goal: Goal;
  utils: {
    canContribute: () => [boolean, string];
    canClaim: () => [boolean, string];
    getBalance: (holder: Account, index: number | undefined, type: string) => number;
    getDescribedEntity: (type: string, index: number) => DetailedEntity;
  };
}

// type to store a process reward's DetailedEntity and balance
interface Objective {
  entity: DetailedEntity;
  target: number;
  current: number;
}

export const Progress = (props: Props) => {
  const { goal, accContribution, utils } = props;

  const [objType, setObjType] = useState<DetailedEntity>({ ObjectType: '', image: '', name: '' });

  useEffect(() => {
    const type = utils.getDescribedEntity(
      goal.objective.target.type,
      goal.objective.target.index ?? 0
    );
    setObjType(type);
  }, [goal]);

  const max = goal.objective.target.value ?? 0;
  const rightText = ` ${parseQuantity(objType, goal.currBalance)}/${parseQuantity(objType, max)}`;
  const contributedAmtText = `You've contributed ${parseQuantity(objType, accContribution ? accContribution.score : 0)}`;

  return (
    <Container>
      <SubTitleText>Progress</SubTitleText>
      <Row>
        <div style={{ flexGrow: 1 }}>
          <ProgressBar
            max={max}
            current={goal.currBalance}
            rightText={rightText}
            width={90}
            indicator
          />
        </div>
        <ActionBar
          actions={props.actions}
          account={props.account}
          goal={props.goal}
          utils={utils}
        />
      </Row>
      <SubText>{contributedAmtText}</SubText>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column;

  margin: 1vh 1vw;
`;

const Row = styled.div`
  display: flex;
  flex-flow: row;
  justify-content: space-around;
`;

const SubTitleText = styled.h2`
  font-size: 1.2vw;
  font-family: Pixel;
  text-align: left;
  color: #333;

  padding: 0 1vw;
`;

const SubText = styled.p`
  font-size: 1vw;
  font-family: Pixel;
  text-align: center;
  color: #333;

  padding: 1vh 1vw 0;
`;
