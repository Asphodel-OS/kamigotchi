import { useVisibility } from 'layers/react/store/visibility';
import { useSelected } from 'layers/react/store/selected';
import { playClick } from 'utils/sounds';

export const triggerNodeModal = (index: number) => {
  const { modals } = useVisibility.getState();
  const { setNode } = useSelected.getState();

  if (!modals.node) {
    playClick();
    setNode(index);
    useVisibility.setState({
      modals: {
        ...modals,
        node: true,
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        kami: false,
        gacha: false,
        emaBoard: false,
        nameKami: false,
      },
    });
  }
  // } else {
  //   useVisibility.setState({ modals: { ...modals, node: false } });
  // }
};
