import { useComponentSettings } from 'layers/react/store/componentSettings';
import { playClick } from 'utils/sounds';

export const triggerERC721BridgeModal = () => {
  const { modals } = useComponentSettings.getState();

  if (!modals.bridgeERC721 && !modals.node) {
    playClick();
    useComponentSettings.setState({
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
  //   useComponentSettings.setState({ modals: { ...modals, bridgeERC721: false } });
  // }
};
