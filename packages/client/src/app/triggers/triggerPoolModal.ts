import { useVisibility } from 'app/stores';
import { playClick } from 'utils/sounds';

export const triggerPoolModal = () => {
  const { modals } = useVisibility.getState();

  if (!modals.pool) {
    playClick();
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
