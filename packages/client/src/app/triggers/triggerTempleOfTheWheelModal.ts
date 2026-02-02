import { useVisibility } from 'app/stores';
import { playClick } from 'utils/sounds';

export const triggerTempleOfTheWheelModal = () => {
  const { modals } = useVisibility.getState();
  playClick();

  if (!modals.templeOfTheWheel) {
    useVisibility.setState({
      modals: {
        ...modals,
        templeOfTheWheel: true,
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
    useVisibility.setState({ modals: { ...modals, templeOfTheWheel: false } });
  }
};
