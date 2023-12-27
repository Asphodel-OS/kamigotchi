import { useVisibility } from 'layers/react/store/visibility';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';
import { playClick } from 'utils/sounds';

export const triggerNodeModal = (index: number) => {
  const { modals } = useVisibility.getState();
  const { setNode } = useSelectedEntities.getState();

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
        kamiMint: false,
        emaBoard: false,
        nameKami: false,
      },
    });
  }
  // } else {
  //   useVisibility.setState({ modals: { ...modals, node: false } });
  // }
};
