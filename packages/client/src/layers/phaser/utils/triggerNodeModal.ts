import { dataStore } from 'layers/react/store/createStore';

export const triggerNodeModal = () => {
  const { visibleModals } = dataStore.getState();
  dataStore.setState({
    visibleModals: { ...visibleModals, node: true, dialogue: false },
  });
};
