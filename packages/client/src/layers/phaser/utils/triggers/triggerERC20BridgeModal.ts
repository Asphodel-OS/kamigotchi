import { useVisibility } from 'layers/react/store/visibility';
import { playClick } from 'utils/sounds';

export const triggerERC20BridgeModal = () => {
  const { modals } = useVisibility.getState();
  playClick();

  if (!modals.bridgeERC20) {
    useVisibility.setState({
      modals: {
        ...modals,
        bridgeERC20: true,
        bridgeERC721: false,
        dialogue: false,
        kami: false,
        emaBoard: false,
        map: false,
        nameKami: false,
        node: false,
        leaderboard: false,
      },
    });
  } else {
    useVisibility.setState({ modals: { ...modals, bridgeERC20: false } });
  }
};
