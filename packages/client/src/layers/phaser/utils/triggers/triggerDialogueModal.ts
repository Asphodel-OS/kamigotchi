import { useVisibility } from 'layers/react/store/visibility';
import { useSelected } from 'layers/react/store/selected';
import { playClick } from 'utils/sounds';

export const triggerDialogueModal = (index: number) => {
  const { modals } = useVisibility.getState();
  const { dialogueIndex } = useSelected.getState();
  playClick();

  useSelected.setState({ dialogueIndex: index });
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
