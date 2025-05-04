import { useState } from 'react';
import styled from 'styled-components';

import { Quest } from 'network/shapes/Quest';
import { BaseQuest } from 'network/shapes/Quest/quest';
import { DetailedEntity } from 'network/shapes/utils';
import { EmptyText } from '../../../library/text/EmptyText';
import { CompletedQuests } from './Completed';
import { OngoingQuests } from './Ongoing';

interface Props {
  quests: {
    ongoing: BaseQuest[];
    completed: BaseQuest[];
  };
  actions: QuestModalActions;
  utils: {
    populate: (quest: BaseQuest) => Quest;
    parseStatus: (quest: Quest) => Quest;
    parseRequirements: (quest: Quest) => Quest;
    parseObjectives: (quest: Quest) => Quest;
    describeEntity: (type: string, index: number) => DetailedEntity;
    getItemBalance: (index: number) => number;
  };
  imageCache: Map<string, JSX.Element>;
  isVisible: boolean;
}

export const AcceptedTab = (props: Props) => {
  const { quests, actions, utils, imageCache, isVisible } = props;
  const { ongoing, completed } = quests;
  const [showCompleted, setShowCompleted] = useState(false);
  const emptyText = ['No ongoing quests.', 'Get a job?'];

  return (
    <Container style={{ display: isVisible ? 'block' : 'none' }}>
      {ongoing.length === 0 && <EmptyText text={emptyText} />}
      <OngoingQuests
        quests={ongoing}
        actions={actions}
        utils={utils}
        imageCache={imageCache}
        isVisible={isVisible}
      />
      <CollapseText onClick={() => setShowCompleted(!showCompleted)}>
        {showCompleted ? '- Completed -' : '- Completed (collapsed) -'}
      </CollapseText>
      <CompletedQuests
        quests={completed}
        actions={actions}
        utils={utils}
        imageCache={imageCache}
        isVisible={showCompleted}
      />
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
`;

const CollapseText = styled.button`
  border: none;
  background-color: transparent;

  width: 100%;
  textalign: center;
  padding: 0.5vw;

  color: #bbb;
  font-family: Pixel;
  font-size: 0.85vw;
  text-align: center;

  &:hover {
    color: #666;
    cursor: pointer;
  }
`;
