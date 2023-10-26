import { dataStore } from 'layers/react/store/createStore';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';
import { playClick } from 'utils/sounds';

export const triggerDialogueModal = (index: number) => {
  const { visibleModals } = dataStore.getState();
  const { dialogueIndex } = useSelectedEntities.getState();
  playClick();

  useSelectedEntities.setState({ dialogueIndex: index });
  if (!visibleModals.dialogue) {
    dataStore.setState({
      visibleModals: {
        ...visibleModals,
        dialogue: true,
        bridgeERC721: false,
        bridgeERC20: false,
        kami: false,
        emaBoard: false,
        map: false,
        nameKami: false,
        node: false,
        party: false,
        leaderboard: false,
      },
    });
  } else if (dialogueIndex === index) {
    dataStore.setState({ visibleModals: { ...visibleModals, dialogue: false } });
  }
};
