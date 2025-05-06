export interface Details {
  title: string;
  type: string; // starting type. can be overwritten by filter selection
  showFilter?: boolean;
  scoreTitle?: string;
  scorePrefix?: string;
}

export type LeaderboardKey = keyof typeof LeaderboardsDetails;

export const LeaderboardsDetails = {
  default: {
    title: 'Leaderboard',
    type: 'COLLECT',
    showFilter: true,
  },
  minaSpent: {
    title: "Mina's fav customers <3",
    type: 'TOTAL_SPENT',
    scoreTitle: 'Spent',
    scorePrefix: '$',
  },
  liquidate: {
    title: 'Liquidators',
    type: 'LIQUIDATE',
  },
};
