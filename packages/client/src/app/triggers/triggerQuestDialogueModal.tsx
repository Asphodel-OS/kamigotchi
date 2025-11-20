import { useSelected, useVisibility } from 'app/stores';
import { EntityIndex } from 'engine/recs';

import { playClick } from 'utils/sounds';

export const triggerQuestDialogueModal = (entity: EntityIndex) => {
  const { questIndex } = useSelected.getState();
  const { setModals, modals } = useVisibility.getState();
  playClick();

  useSelected.setState({ questIndex: entity });

  if (!modals.questDialogue || questIndex !== entity) {
    setModals({
      dialogue: false,
      questDialogue: true,
      bridgeERC20: false,
      bridgeERC721: false,
      emaBoard: false,
      kami: false,
      map: false,
      merchant: false,
      node: false,
      party: false,
      leaderboard: false,
    });
  } else {
    setModals({ questDialogue: false });
  }
};
