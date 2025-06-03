import { useSelected, useVisibility } from 'app/stores';
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
      },
    });
  }
  // } else {
  //   useVisibility.setState({ modals: { ...modals, node: false } });
  // }
};
