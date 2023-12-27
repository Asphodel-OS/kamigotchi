import { useVisibility } from 'layers/react/store/visibility';
import { useSelectedEntities } from 'layers/react/store/selectedEntities'
import { playClick } from 'utils/sounds';

export const triggerShopModal = (npcIndex: number) => {
  const { modals } = useVisibility.getState();
  const { setNpc } = useSelectedEntities.getState();
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
}
