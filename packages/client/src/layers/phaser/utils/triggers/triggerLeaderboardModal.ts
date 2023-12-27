import { useComponentSettings } from 'layers/react/store/componentSettings';
import { playClick } from 'utils/sounds';

export const triggerLeaderboardModal = () => {
  const { modals } = useComponentSettings.getState();
  playClick();

  if (!modals.leaderboard) {
    useComponentSettings.setState({
      modals: {
        ...modals,
        leaderboard: true,
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        map: false,
        roomMovement: false,
        chat: false,
      },
    });
  } else {
    useComponentSettings.setState({ modals: { ...modals, leaderboard: false } });
  }
};
