import { useState } from 'react';
import styled from 'styled-components';

import { Quest } from 'network/shapes/Quest';
import { BaseQuest } from 'network/shapes/Quest/quest';
import { DetailedEntity } from 'network/shapes/utils';
import { AcceptedTab } from './AcceptedTab';
import { AvailableTab } from './AvailableTab';

interface Props {
  quests: {
    available: Quest[];
    ongoing: BaseQuest[];
    completed: BaseQuest[];
  };
  mode: TabType;
  actions: QuestModalActions;
  utils: {
    getItemBalance: (index: number) => number;
    populate: (quest: BaseQuest) => Quest;
    parseStatus: (quest: Quest) => Quest;
    parseObjectives: (quest: Quest) => Quest;
    parseRequirements: (quest: Quest) => Quest;
    describeEntity: (type: string, index: number) => DetailedEntity;
  };
}

export const List = (props: Props) => {
  const { quests, mode, actions, utils } = props;
  const { available, ongoing, completed } = quests;
  const [imageCache, _] = useState(new Map<string, JSX.Element>());

  return (
    <Container>
      <AvailableTab
        quests={available}
        actions={actions}
        utils={utils}
        imageCache={imageCache}
        isVisible={mode === 'AVAILABLE'}
      />
      <AcceptedTab
        quests={{ ongoing, completed }}
        actions={actions}
        utils={utils}
        imageCache={imageCache}
        isVisible={mode === 'ONGOING'}
      />
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  padding: 0.6vw;
  user-select: none;
`;
