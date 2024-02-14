import styled from 'styled-components';

import { useVisibility } from 'layers/react/store/visibility';
import { playClick } from 'utils/sounds';

interface Props {
  divName: string;
  position?: string;
}

// ExitButton is a rendering o fan exit button, which closes the modal it's on
export const ExitButton = (props: Props) => {
  const { modals, setModals } = useVisibility();

  // closes the modal this exit button is on
  const handleClose = () => {
    playClick();
    setModals({ ...modals, [props.divName]: false });
  };

  return <Button onClick={handleClose}>X</Button>;
};

const Button = styled.button`
  background-color: #ffffff;
  border-radius: 0.4vw;
  border: 0.15vw solid black;

  color: black;
  justify-self: right;
  padding: 0.3vw 0.4vw;
  margin: 0.7vw;
  z-index: 1;

  font-family: Pixel;
  font-size: 0.9vw;

  cursor: pointer;
  pointer-events: auto;

  &:hover {
    background-color: #e8e8e8;
  }

  &:active {
    background-color: #c4c4c4;
  }
`;
