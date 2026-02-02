import { useSelected, useVisibility } from 'app/stores';
import { EntityIndex } from 'engine/recs';

import { playClick } from 'utils/sounds';

export const triggerQuestDetailsModal = (entity: EntityIndex) => {
  const { questIndex } = useSelected.getState();
  const { setModals, modals } = useVisibility.getState();
  playClick();

  useSelected.setState({ questIndex: entity });

  if (!modals.questDialogue || questIndex !== entity) {
    setModals({
      dialogue: false,
      questDialogue: true,
    });
  } else {
    setModals({ questDialogue: false });
  }
};
