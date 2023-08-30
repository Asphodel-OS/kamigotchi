import { dataStore } from 'layers/react/store/createStore';
import clickSound from 'assets/sound/fx/mouseclick.wav';

export const triggerLeaderboardModal = () => {
  const {
    visibleModals,
    sound: { volume },
  } = dataStore.getState();

  const clickFX = new Audio(clickSound);
  clickFX.volume = volume;
  clickFX.play();

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
