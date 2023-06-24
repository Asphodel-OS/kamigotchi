import { dataStore } from 'layers/react/store/createStore';

export const triggerLeaderboardModal = () => {
  const { visibleModals } = dataStore.getState();

  !visibleModals.leaderboard &&
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
};
