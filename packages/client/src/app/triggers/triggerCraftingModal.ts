import { useSelected, useVisibility } from 'app/stores';
import { playClick } from 'utils/sounds';

export const triggerCraftingModal = (assignerID: string) => {
  const { modals } = useVisibility.getState();
  const { setAssigner } = useSelected.getState();

  if (!modals.crafting) {
    playClick();
    setAssigner(assignerID);
    useVisibility.setState({
      modals: {
        ...modals,
        crafting: true,
        goal: false,
        node: false,
        dialogue: false,
        merchant: false,
      },
    });
  }
};
