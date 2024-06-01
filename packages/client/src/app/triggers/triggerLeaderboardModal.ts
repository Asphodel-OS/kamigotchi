import { useSelected, useVisibility } from 'app/stores';
import { LeaderboardKey } from 'constants/leaderboards/leaderboards';
import { playClick } from 'utils/sounds';

export const triggerLeaderboardModal = (index?: LeaderboardKey) => {
  const { modals } = useVisibility.getState();
  const { leaderboardKey } = useSelected.getState();
  playClick();

  if (!index) index = 'default';
  useSelected.setState({ leaderboardKey: index });
  if (!modals.leaderboard) {
    useVisibility.setState({
      modals: {
        ...modals,
        leaderboard: true,
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        map: false,
      },
    });
  } else {
    useVisibility.setState({ modals: { ...modals, leaderboard: false } });
  }
};
