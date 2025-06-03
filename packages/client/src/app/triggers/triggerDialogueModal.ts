import { useSelected, useVisibility } from 'app/stores';
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
        bridgeERC20: false,
        bridgeERC721: false,
        emaBoard: false,
        kami: false,
        map: false,
        merchant: false,
        node: false,
        party: false,
        leaderboard: false,
      },
    });
  } else if (dialogueIndex === index) {
    useVisibility.setState({ modals: { ...modals, dialogue: false } });
  }
};
