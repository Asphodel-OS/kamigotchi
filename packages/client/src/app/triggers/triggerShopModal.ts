import { useSelected, useVisibility } from 'app/stores';
import { playClick } from 'utils/sounds';

export const triggerShopModal = (npcIndex: number) => {
  const { modals } = useVisibility.getState();
  const { setNpc } = useSelected.getState();
  playClick();

  if (!modals.merchant) {
    setNpc(npcIndex);
    useVisibility.setState({
      modals: {
        ...modals,
        merchant: true,
        map: false,
      },
    });
  } else {
    useVisibility.setState({ modals: { ...modals, merchant: false } });
  }
};
