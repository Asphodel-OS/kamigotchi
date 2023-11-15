import { useComponentSettings } from 'layers/react/store/componentSettings';

export const closeModalsOnRoomChange = () => {
  const { modals } = useComponentSettings.getState();

  useComponentSettings.setState({
    modals: {
      ...modals,
      dialogue: false,
      merchant: false,
      kamiMint: false,
      kami: false,
      node: false,
    },
  });
};
