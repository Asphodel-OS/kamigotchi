import { useVisibility } from 'app/stores';
import { playClick } from 'utils/sounds';

// silent: for callers whose own control already plays the click (IconButton)
export const triggerPoolModal = (opts?: { silent?: boolean }) => {
  const { modals } = useVisibility.getState();

  if (!modals.pool) {
    if (!opts?.silent) playClick();
    useVisibility.setState({
      modals: {
        ...modals,
        pool: true,
        crafting: false,
        dialogue: false,
        kami: false,
        leaderboard: false,
        node: false,
      },
    });
  }
};
