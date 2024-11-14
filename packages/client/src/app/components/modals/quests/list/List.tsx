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
  scrollPosition?: number;
  utils: {
    getItemBalance: (index: number) => number;
    populate: (quest: BaseQuest) => Quest;
    parseStatus: (quest: Quest) => Quest;
    parseObjectives: (quest: Quest) => Quest;
    parseRequirements: (quest: Quest) => Quest;
    describeEntity: (type: string, index: number) => DetailedEntity;
    filterOutBattlePass: (quests: Quest[]) => Quest[];
  };
}

export const List = (props: Props) => {
  const { quests, mode, actions, utils, scrollPosition } = props;
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
        scrollPosition={scrollPosition}
      />
      <AcceptedTab
        quests={{ ongoing, completed }}
        actions={actions}
        utils={utils}
        imageCache={imageCache}
        isVisible={mode === 'ONGOING'}
        scrollPosition={scrollPosition}
      />
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  padding: 0.6vw;
`;
