import { useEffect, useState } from 'react';

import { useVisibility } from 'app/stores';
import { Quest, sortCompletedQuests } from 'network/shapes/Quest';
import { BaseQuest } from 'network/shapes/Quest/quest';
import { DetailedEntity } from 'network/shapes/utils';
import { QuestCard } from './QuestCard';

const STALE_TIME = 5000;

export const CompletedQuests = ({
  quests,
  actions,
  utils,
  imageCache,
  isVisible,
}: {
  quests: BaseQuest[];
  actions: QuestModalActions;
  utils: {
    populate: (quest: BaseQuest) => Quest;
    describeEntity: (type: string, index: number) => DetailedEntity;
    getItemBalance: (index: number) => number;
  };
  imageCache: Map<string, JSX.Element>;
  isVisible: boolean;
}) => {
  const { describeEntity, populate, getItemBalance } = utils;
  const { modals } = useVisibility();
  const [cleaned, setCleaned] = useState<Quest[]>([]);
  const [lastUpdate, setLastUpdate] = useState(0);

  // always update if the list of quests changes
  useEffect(() => {
    update();
  }, [quests.length]);

  // update when this tab is opened or data changes if stale
  useEffect(() => {
    const isStale = Date.now() - lastUpdate > STALE_TIME;
    if (modals.quests && isVisible && isStale) update();
  }, [modals.quests, isVisible]);

  const update = async () => {
    const fullQuests = quests.map((q) => populate(q));
    const sorted = sortCompletedQuests(fullQuests);
    setCleaned(sortCompletedQuests(sorted));
    setLastUpdate(Date.now());
  };

  return (
    <div style={{ display: isVisible ? 'block' : 'none' }}>
      {cleaned.map((q: Quest) => (
        <QuestCard
          key={q.id}
          quest={q}
          status={'COMPLETED'}
          utils={{ describeEntity, getItemBalance }}
          actions={actions}
          imageCache={imageCache}
        />
      ))}
    </div>
  );
};
