import { useVisibility } from 'layers/react/store/visibility';
import { playClick } from 'utils/sounds';

export const triggerERC721BridgeModal = () => {
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
        nameKami: false,
        node: false,
        leaderboard: false,
      },
    });
  }
  // else {
  //   useVisibility.setState({ modals: { ...modals, bridgeERC721: false } });
  // }
};
