import { dataStore } from 'layers/react/store/createStore';
import { playClick } from 'utils/sounds';

export const triggerLeaderboardModal = () => {
  const { visibleModals } = dataStore.getState();
  playClick();

  if (!visibleModals.leaderboard) {
    dataStore.setState({
      visibleModals: {
        ...visibleModals,
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
    dataStore.setState({ visibleModals: { ...visibleModals, leaderboard: false } });
  }
};
