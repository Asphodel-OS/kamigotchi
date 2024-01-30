import { useVisibility } from 'layers/react/store/visibility';
import { playClick } from 'utils/sounds';

export const triggerPetMintModal = () => {
  const { modals } = useVisibility.getState();
  playClick();

  if (!modals.gacha) {
    useVisibility.setState({
      modals: {
        ...modals,
        gacha: true,
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        kami: false,
        emaBoard: false,
        map: false,
        nameKami: false,
        node: false,
      },
    });
  } else {
    useVisibility.setState({ modals: { ...modals, gacha: false } });
  }
};
