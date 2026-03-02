import { useVisibility } from 'app/stores';
import { playClick } from 'utils/sounds';

export const triggerKamiAdoptionAgencyModal = () => {
  const { modals } = useVisibility.getState();
  playClick();

  if (!modals.kamiAdoptionAgency) {
    useVisibility.setState({
      modals: {
        ...modals,
        kamiAdoptionAgency: true,
        bridgeERC20: false,
        bridgeERC721: false,
        crafting: false,
        dialogue: false,
        kami: false,
        emaBoard: false,
        map: false,
        node: false,
      },
    });
  } else {
    useVisibility.setState({ modals: { ...modals, kamiAdoptionAgency: false } });
  }
};
