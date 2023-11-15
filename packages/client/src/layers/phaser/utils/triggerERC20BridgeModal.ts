import { useComponentSettings } from 'layers/react/store/componentSettings';
import { playClick } from 'utils/sounds';

export const triggerERC20BridgeModal = () => {
  const { modals } = useComponentSettings.getState();
  playClick();

  if (!modals.bridgeERC20) {
    useComponentSettings.setState({
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
    useComponentSettings.setState({ modals: { ...modals, bridgeERC20: false } });
  }
};
