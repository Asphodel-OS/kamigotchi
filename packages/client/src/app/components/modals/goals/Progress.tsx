import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { ProgressBar } from 'app/components/library';
import { Contribution, Goal } from 'layers/network/shapes/Goal';
import { DetailedEntity } from 'layers/network/shapes/utils/EntityTypes';
import { parseQuantity } from 'layers/network/shapes/utils/parseDescription';

interface Props {
  goal: Goal;
  accContribution: Contribution | undefined;
  getDescribedEntity: (type: string, index: number) => DetailedEntity;
}

// type to store a process reward's DetailedEntity and balance
interface Objective {
  entity: DetailedEntity;
  target: number;
  current: number;
}

export const Progress = (props: Props) => {
  const { goal, accContribution, getDescribedEntity } = props;

  const [objType, setObjType] = useState<DetailedEntity>({ ObjectType: '', image: '', name: '' });

  useEffect(() => {
    const type = getDescribedEntity(goal.objective.target.type, goal.objective.target.index ?? 0);
    setObjType(type);
  }, [goal]);

  const max = goal.objective.target.value ?? 0;
  const rightText = ` ${parseQuantity(objType, goal.currBalance)}/${parseQuantity(objType, max)}`;
  const leftText = `You've given ${parseQuantity(objType, accContribution ? accContribution.score : 0)}`;

  return (
    <Container>
      <SubTitleText>Progress</SubTitleText>
      <ProgressBar
        max={max}
        current={goal.currBalance}
        leftText={leftText}
        rightText={rightText}
        width={90}
        indicator
      />
    </Container>
  );
};

const Container = styled.div`
  margin: 1vh 1vw;
`;

const SubTitleText = styled.h2`
  font-size: 1.2vw;
  font-family: Pixel;
  text-align: left;
  color: #333;

  padding: 0 1vw;
`;
