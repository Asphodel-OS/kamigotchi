import { useEffect, useState } from 'react';

import { useVisibility } from 'app/stores';
import { filterOngoingQuests, Quest, sortOngoingQuests } from 'network/shapes/Quest';
import { BaseQuest } from 'network/shapes/Quest/quest';
import { DetailedEntity } from 'network/shapes/utils';
import { QuestCard } from '../QuestCard';

interface Props {
  quests: BaseQuest[];
  actions: {
    accept: (quest: Quest) => void;
    complete: (quest: Quest) => void;
  };
  utils: {
    populate: (quest: BaseQuest) => Quest;
    parseStatus: (quest: Quest) => Quest;
    parseRequirements: (quest: Quest) => Quest;
    parseObjectives: (quest: Quest) => Quest;
    describeEntity: (type: string, index: number) => DetailedEntity;
  };
  imageCache: Map<string, JSX.Element>;
  isVisible: boolean;
}

export const OngoingQuests = (props: Props) => {
  const { quests, utils, actions, imageCache, isVisible } = props;
  const { describeEntity, parseStatus, populate, parseRequirements, parseObjectives } = utils;
  const { modals } = useVisibility();
  const [cleaned, setCleaned] = useState<Quest[]>([]);

  // TODO: Include more dependencies
  useEffect(() => {
    update();
  }, [modals.quests, quests.length]);

  const update = () => {
    const fullQuests = quests.map((q) => populate(q));
    const filtered = filterOngoingQuests(fullQuests);
    const parsed = filtered.map((q: Quest) => parseObjectives(q));
    const sorted = sortOngoingQuests(parsed);
    setCleaned(sorted);
  };

  return (
    <div style={{ display: isVisible ? 'block' : 'none' }}>
      {cleaned.map((q: Quest) => (
        <QuestCard
          key={q.id}
          quest={q}
          status={'ONGOING'}
          utils={{ describeEntity }}
          actions={actions}
          imageCache={imageCache}
        />
      ))}
    </div>
  );
};
