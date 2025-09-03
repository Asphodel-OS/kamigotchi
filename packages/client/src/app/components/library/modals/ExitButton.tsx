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
    isValidator
      ? setValidators({ [divName]: false })
      : setModals({ [divName]: false });
  };

  return <Button onClick={handleClose}>X</Button>;
};

const Button = styled.button`
  background-color: #ffffff;
  border: 0.15vw solid black;
  border-radius: 0.6vw;

  color: black;
  padding: 0.3vw 0.4vw;
  z-index: 1;

  font-size: 0.9vw;
  cursor: pointer;

  &:hover {
    background-color: #e8e8e8;
  }

  &:active {
    background-color: #c4c4c4;
  }
`;
