import { useEffect, useState } from 'react';

import { useVisibility } from 'app/stores';
import { filterOngoingQuests, Quest, sortOngoingQuests } from 'network/shapes/Quest';
import { BaseQuest } from 'network/shapes/Quest/quest';
import { DetailedEntity } from 'network/shapes/utils';
import { QuestCard } from './QuestCard';

const STALE_TIME = 1500;
const REFRESH_TIME = 3333;

export const OngoingQuests = ({
  quests,
  utils,
  actions,
  imageCache,
  isVisible,
}: {
  quests: BaseQuest[];
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
  const { populate, parseObjectives } = utils;
  const { modals } = useVisibility();
  const [cleaned, setCleaned] = useState<Quest[]>([]);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [lastUpdate, setLastUpdate] = useState(0);

  // time trigger to use for periodic refreshes
  useEffect(() => {
    const timerId = setInterval(() => setLastRefresh(Date.now()), REFRESH_TIME);
    return () => clearInterval(timerId);
  }, []);

  // always update if the list of quests changes
  useEffect(() => {
    update();
  }, [quests.length]);

  // update when this tab is opened or data changes if stale
  useEffect(() => {
    const isStale = Date.now() - lastUpdate > STALE_TIME;
    if (modals.quests && isVisible && isStale) update();
  }, [modals.quests, isVisible]);

  // update data every cycle when this list is visible
  useEffect(() => {
    if (modals.quests && isVisible) update();
  }, [lastRefresh]);

  const update = async () => {
    const fullQuests = quests.map((q) => populate(q));
    const filtered = filterOngoingQuests(fullQuests);
    const parsed = filtered.map((q: Quest) => parseObjectives(q));
    const sorted = sortOngoingQuests(parsed);
    setCleaned(sorted);
    setLastUpdate(Date.now());
  };

  return (
    <div>
      {cleaned.map((q: Quest) => (
        <QuestCard
          key={q.id}
          quest={q}
          status={'ONGOING'}
          utils={utils}
          actions={actions}
          imageCache={imageCache}
        />
      ))}
    </div>
  );
};
