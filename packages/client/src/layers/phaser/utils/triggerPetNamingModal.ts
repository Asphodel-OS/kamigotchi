import { useComponentSettings } from 'layers/react/store/componentSettings';
import { playClick } from 'utils/sounds';

export const triggerPetNamingModal = () => {
  const { modals } = useComponentSettings.getState();
  playClick();

  if (!modals.emaBoard) {
    useComponentSettings.setState({
      modals: {
        ...modals,
        emaBoard: true,
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        kami: false,
        kamiMint: false,
        map: false,
        nameKami: false,
        node: false,
      },
    });
  } else {
    useComponentSettings.setState({ modals: { ...modals, emaBoard: false } });
  }
};
