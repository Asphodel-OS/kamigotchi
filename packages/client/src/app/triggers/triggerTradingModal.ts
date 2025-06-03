import { useVisibility } from 'app/stores';
import { playClick } from 'utils/sounds';

export const triggerTradingModal = () => {
  const { modals } = useVisibility.getState();

  if (!modals.trading) {
    playClick();
    useVisibility.setState({
      modals: {
        ...modals,
        dialogue: false,
        kami: false,
        leaderboard: false,
        node: false,
        trading: true,
      },
    });
  }
};
