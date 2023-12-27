import { useVisibility } from 'layers/react/store/visibility';
import { playClick } from 'utils/sounds';

export const triggerPetMintModal = () => {
  const { modals } = useVisibility.getState();
  playClick();

  if (!modals.kamiMint) {
    useVisibility.setState({
      modals: {
        ...modals,
        kamiMint: true,
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
    useVisibility.setState({ modals: { ...modals, kamiMint: false } });
  }
};
