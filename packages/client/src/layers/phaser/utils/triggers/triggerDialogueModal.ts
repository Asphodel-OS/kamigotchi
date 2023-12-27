import { useVisibility } from 'layers/react/store/visibility';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';
import { playClick } from 'utils/sounds';

export const triggerDialogueModal = (index: number) => {
  const { modals } = useVisibility.getState();
  const { dialogueIndex } = useSelectedEntities.getState();
  playClick();

  useSelectedEntities.setState({ dialogueIndex: index });
  if (!modals.dialogue) {
    useVisibility.setState({
      modals: {
        ...modals,
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
    useVisibility.setState({ modals: { ...modals, dialogue: false } });
  }
};
