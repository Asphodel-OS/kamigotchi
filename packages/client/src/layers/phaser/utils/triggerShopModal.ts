import { dataStore } from 'layers/react/store/createStore';
import { useSelectedEntities } from 'layers/react/store/selectedEntities'
import { playClick } from 'utils/sounds';

export const triggerShopModal = (npcIndex: number) => {
  const { visibleModals } = dataStore.getState();
  const { setNpc } = useSelectedEntities.getState();
  playClick();

  if (!visibleModals.merchant) {
    console.log('triggerShopModal: opening');
    setNpc(npcIndex);
    dataStore.setState({
      visibleModals: {
        ...visibleModals,
        merchant: true,
        map: false,
      },
    });
  } else {
    console.log('triggerShopModal: closing');
    dataStore.setState({ visibleModals: { ...visibleModals, merchant: false } });
  }
}
