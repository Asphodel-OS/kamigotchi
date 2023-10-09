import { dataStore } from 'layers/react/store/createStore';
import { useSelectedEntities } from 'layers/react/store/selectedEntities'
import { playClick } from 'utils/sounds';

export const triggerShopModal = (npcIndex: number) => {
  const { visibleModals } = dataStore.getState();
  const { setNpc } = useSelectedEntities.getState();
  playClick();

  if (!visibleModals.merchant) {
    setNpc(npcIndex);
    dataStore.setState({
      visibleModals: {
        ...visibleModals,
        merchant: true,
        map: false,
      },
    });
  } else {
    dataStore.setState({ visibleModals: { ...visibleModals, merchant: false } });
  }
}
