import { leaderboardsDetails } from 'constants/leaderboards/leaderboards';
import { useSelected, useVisibility } from 'layers/react/store';
import { playClick } from 'utils/sounds';

export const triggerLeaderboardModal = (index?: keyof typeof leaderboardsDetails) => {
  const { modals } = useVisibility.getState();
  const { leaderboardIndex } = useSelected.getState();
  playClick();

  if (!index) index = 'default';
  useSelected.setState({ leaderboardIndex: index });
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
