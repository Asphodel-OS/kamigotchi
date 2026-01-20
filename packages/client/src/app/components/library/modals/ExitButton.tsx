import styled from 'styled-components';

import { useVisibility } from 'app/stores';
import { playClick } from 'utils/sounds';

// ExitButton is a rendering of an exit button, which closes the modal it's on
export const ExitButton = ({
  divName,
  position,
  isValidator,
}: {
  divName: string;
  position?: string;
  isValidator?: boolean;
}) => {
  const setModals = useVisibility((s) => s.setModals);
  const setValidators = useVisibility((s) => s.setValidators);

  // closes the modal this exit button is on
  const handleClose = () => {
    playClick();
    isValidator ? setValidators({ [divName]: false }) : setModals({ [divName]: false });
  };

  return <Button onClick={handleClose}>X</Button>;
};

const Button = styled.button`
  background-color: var(--bg-primary, #ffffff);
  border: 0.15vw solid var(--border-primary, black);
  border-radius: 0.6vw;

  color: var(--text-primary, black);
  padding: 0.3vw 0.4vw;

  font-size: 0.9vw;
  cursor: pointer;

  &:hover {
    background-color: var(--hover-bg, #e8e8e8);
  }

  &:active {
    background-color: var(--active-bg, #c4c4c4);
  }
  z-index: 1;
`;
