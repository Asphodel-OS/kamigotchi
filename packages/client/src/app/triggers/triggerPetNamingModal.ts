import { useVisibility } from 'app/store';
import { playClick } from 'utils/sounds';

export const triggerPetNamingModal = () => {
  const { modals } = useVisibility.getState();
  playClick();

  if (!modals.emaBoard) {
    useVisibility.setState({
      modals: {
        ...modals,
        emaBoard: true,
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        kami: false,
        gacha: false,
        map: false,
        nameKami: false,
        node: false,
      },
    });
  } else {
    useVisibility.setState({ modals: { ...modals, emaBoard: false } });
  }
};
