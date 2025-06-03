import { useSelected, useVisibility } from 'app/stores';
import { playClick } from 'utils/sounds';

export const triggerGoalModal = (index: number[]) => {
  const { modals } = useVisibility.getState();
  const { setGoal } = useSelected.getState();

  if (!modals.node) {
    playClick();
    setGoal(index);
    useVisibility.setState({
      modals: {
        ...modals,
        goal: true,
        node: false,
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        kami: false,
        gacha: false,
        emaBoard: false,
        merchant: false,
      },
    });
  }
};
