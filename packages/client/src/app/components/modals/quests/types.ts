type TabType = 'AVAILABLE' | 'ONGOING';
type QuestStatus = 'AVAILABLE' | 'ONGOING' | 'COMPLETED';

type QuestModalActions = {
  accept: (quest: any) => void;
  complete: (quest: any) => void;
  burnItems: (indices: number[], amts: number[]) => void;
};
