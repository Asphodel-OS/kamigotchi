import { dataStore } from 'layers/react/store/createStore';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';
import { playClick } from 'utils/sounds';

export const triggerNodeModal = (index: number) => {
  const { visibleModals } = dataStore.getState();
  const { setNode } = useSelectedEntities.getState();

  if (!visibleModals.node) {
    playClick();
    setNode(index);
    dataStore.setState({
      visibleModals: {
        ...visibleModals,
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
  //   dataStore.setState({ visibleModals: { ...visibleModals, node: false } });
  // }
};
