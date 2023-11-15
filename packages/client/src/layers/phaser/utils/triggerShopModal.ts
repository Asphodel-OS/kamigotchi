import { useComponentSettings } from 'layers/react/store/componentSettings';
import { useSelectedEntities } from 'layers/react/store/selectedEntities'
import { playClick } from 'utils/sounds';

export const triggerShopModal = (npcIndex: number) => {
  const { modals } = useComponentSettings.getState();
  const { setNpc } = useSelectedEntities.getState();
  playClick();

  if (!modals.merchant) {
    setNpc(npcIndex);
    useComponentSettings.setState({
      modals: {
        ...modals,
        merchant: true,
        map: false,
      },
    });
  } else {
    useComponentSettings.setState({ modals: { ...modals, merchant: false } });
  }
}
