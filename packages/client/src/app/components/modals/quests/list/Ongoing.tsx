import { useEffect, useState } from 'react';

import { useVisibility } from 'app/stores';
import { filterOngoingQuests, Quest, sortOngoingQuests } from 'network/shapes/Quest';
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
  const { describeEntity, populate, parseObjectives } = utils;
  const { modals } = useVisibility();
  const [cleaned, setCleaned] = useState<Quest[]>([]);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // time trigger to use for periodic refreshes
  useEffect(() => {
    const timerId = setInterval(() => setLastRefresh(Date.now()), 2222);
    return function cleanup() {
      clearInterval(timerId);
    };
  }, []);

  // updates data every 2222ms when this list is visible
  useEffect(() => {
    if (modals.quests && isVisible) update();
  }, [lastRefresh, modals.quests, quests.length]);

  const update = () => {
    const fullQuests = quests.map((q) => populate(q));
    const filtered = filterOngoingQuests(fullQuests);
    const parsed = filtered.map((q: Quest) => parseObjectives(q));
    const sorted = sortOngoingQuests(parsed);
    setCleaned(sorted);
  };

  return (
    <div>
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
