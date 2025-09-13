import { useVisibility } from 'app/stores';
import { playClick } from 'utils/sounds';

export const triggerGachaModal = () => {
  const { modals } = useVisibility.getState();
  playClick();

  if (!modals.gacha) {
    useVisibility.setState({
      modals: {
        ...modals,
        gacha: true,
        bridgeERC20: false,
        bridgeERC721: false,
        crafting: false,
        dialogue: false,
        kami: false,
        emaBoard: false,
        map: false,
        node: false,
      },
    });
  } else {
    useVisibility.setState({ modals: { ...modals, gacha: false } });
  }
};
