import { useEffect, useState } from 'react';

import { Quest, sortCompletedQuests } from 'network/shapes/Quest';
import { BaseQuest } from 'network/shapes/Quest/quest';
import { DetailedEntity } from 'network/shapes/utils';
import { QuestCard } from './QuestCard';

interface Props {
  quests: BaseQuest[];
  actions: {
    accept: (quest: Quest) => void;
    complete: (quest: Quest) => void;
  };
  utils: {
    populate: (quest: BaseQuest) => Quest;
    describeEntity: (type: string, index: number) => DetailedEntity;
  };
  imageCache: Map<string, JSX.Element>;
  isVisible: boolean;
}

export const CompletedQuests = (props: Props) => {
  const { quests, actions, utils, imageCache, isVisible } = props;
  const { describeEntity, populate } = utils;
  const [cleaned, setCleaned] = useState<Quest[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  // load up the data the first time this section is opened
  useEffect(() => {
    if (hasLoaded) return;
    update();
    setHasLoaded(true);
  }, [isVisible]);

  // reload the data whenever the lists of completed quests is updated
  useEffect(() => {
    update();
  }, [quests.length]);

  const update = async () => {
    const fullQuests = quests.map((q) => populate(q));
    const sorted = sortCompletedQuests(fullQuests);
    setCleaned(sortCompletedQuests(sorted));
  };

  return (
    <div style={{ display: isVisible ? 'block' : 'none' }}>
      {cleaned.map((q: Quest) => (
        <QuestCard
          key={q.id}
          quest={q}
          status={'COMPLETED'}
          utils={{ describeEntity }}
          actions={actions}
          imageCache={imageCache}
        />
      ))}
    </div>
  );
};
