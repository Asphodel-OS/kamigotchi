import { dataStore } from 'layers/react/store/createStore';
import clickSound from 'assets/sound/fx/mouseclick.wav';

export const triggerDialogueModal = (description: string[]) => {
  const {
    visibleModals,
    sound: { volume },
  } = dataStore.getState();
  const clickFX = new Audio(clickSound);

  // NOTE: this is just a workaround, the proper solution is to fix the below
  // modals to properly capture any clicks on their rendered interface
  // (ModalWrapper does this)
  if (
    visibleModals.kamisNaming
    || visibleModals.nameKami
    || visibleModals.bridgeERC20
    || visibleModals.bridgeERC721
  ) {
    return;
  }

  clickFX.volume = volume;
  clickFX.play();

  dataStore.setState({ dialogue: { description } });
  if (!visibleModals.dialogue) {
    dataStore.setState({
      visibleModals: {
        ...visibleModals,
        dialogue: true,
        bridgeERC721: false,
        bridgeERC20: false,
        kami: false,
        kamisNaming: false,
        map: false,
        nameKami: false,
        node: false,
        party: false,
      },
    });
  } else {
    dataStore.setState({ visibleModals: { ...visibleModals, bridgeERC721: false } });
  }
};
