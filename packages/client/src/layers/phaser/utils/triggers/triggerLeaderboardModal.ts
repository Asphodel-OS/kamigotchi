import { useVisibility } from 'layers/react/store/visibility';
import { playClick } from 'utils/sounds';

export const triggerLeaderboardModal = () => {
  const { modals } = useVisibility.getState();
  playClick();

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
