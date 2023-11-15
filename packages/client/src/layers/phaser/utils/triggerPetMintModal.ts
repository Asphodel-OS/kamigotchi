import { useComponentSettings } from 'layers/react/store/componentSettings';
import { playClick } from 'utils/sounds';

export const triggerPetMintModal = () => {
  const { modals } = useComponentSettings.getState();
  playClick();

  if (!modals.kamiMint) {
    useComponentSettings.setState({
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
    useComponentSettings.setState({ modals: { ...modals, kamiMint: false } });
  }
};
