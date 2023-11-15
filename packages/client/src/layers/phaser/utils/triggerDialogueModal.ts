import { useComponentSettings } from 'layers/react/store/componentSettings';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';
import { playClick } from 'utils/sounds';

export const triggerDialogueModal = (index: number) => {
  const { modals } = useComponentSettings.getState();
  const { dialogueIndex } = useSelectedEntities.getState();
  playClick();

  useSelectedEntities.setState({ dialogueIndex: index });
  if (!modals.dialogue) {
    useComponentSettings.setState({
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
    useComponentSettings.setState({ modals: { ...modals, dialogue: false } });
  }
};
