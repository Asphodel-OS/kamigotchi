import { useState } from 'react';
import styled from 'styled-components';

import { Quest } from 'network/shapes/Quest';
import { BaseQuest } from 'network/shapes/Quest/quest';
import { DetailedEntity } from 'network/shapes/utils';
import { EmptyText } from '../../../library/text/EmptyText';
import { OngoingQuests } from './Ongoing';

export const AcceptedTab = ({
  quests,
  actions,
  utils,
  imageCache,
  isVisible,
}: {
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
}) => {
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
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
`;
