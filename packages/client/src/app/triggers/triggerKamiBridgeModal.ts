import { useVisibility } from 'app/stores';
import { playClick } from 'utils/sounds';

export const triggerKamiBridgeModal = () => {
  const { modals } = useVisibility.getState();

  if (!modals.bridgeERC721 && !modals.node) {
    playClick();
    useVisibility.setState({
      modals: {
        ...modals,
        bridgeERC721: true,
        bridgeERC20: false,
        dialogue: false,
        kami: false,
        emaBoard: false,
        map: false,
        node: false,
        leaderboard: false,
      },
    });
  }
  // else {
  //   useVisibility.setState({ modals: { ...modals, bridgeERC721: false } });
  // }
};
