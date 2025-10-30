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
  background-color: #ffffff;
  border: 0.15rem solid black;
  border-radius: 0.6rem;

  padding: 0.3rem 0.4rem;
  z-index: 1;

  color: black;
  font-size: 0.9rem;

  cursor: pointer;

  &:hover {
    background-color: #e8e8e8;
  }

  &:active {
    background-color: #c4c4c4;
  }
`;
