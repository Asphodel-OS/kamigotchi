import styled from 'styled-components';

import { IconButton, Overlay, Text } from 'app/components/library';

// for defining state variables
export interface ConfirmationData {
  title?: string;
  subTitle?: string;
  content: React.ReactNode; // content to be displayed
  onConfirm: () => void;
}

interface Props {
  title?: string;
  subTitle?: string;
  children: React.ReactNode; // content to be displayed
  onConfirm: () => void;
  controls: {
    isOpen: boolean;
    close: () => void;
  };
}

export const Confirmation = (props: Props) => {
  const { title, subTitle, children, onConfirm, controls } = props;
  const { isOpen, close } = controls;

  const handleConfirm = () => {
    onConfirm();
    close();
  };

  return (
    <Overlay fullHeight fullWidth isHidden={!isOpen}>
      <Container>
        <Text size={1.8}>{title ?? 'Pls Confirm'}</Text>
        <Text size={1.2}>{subTitle}</Text>
        {children}
        <Row>
          <IconButton text='Cancel' onClick={close} scale={3} />
          <IconButton text='Confirm' onClick={handleConfirm} scale={3} />
        </Row>
      </Container>
    </Overlay>
  );
};

const Container = styled.div`
  background-color: white;
  position: relative;
  border: solid black 0.15vw;
  border-radius: 1.2vw;
  box-shadow: 0 0 0.3vw black;

  height: 30vw;
  width: 75%;
  gap: 0.3vw;
  padding: 3.3vw 0 1.2vw 0;
  z-index: 2;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;

  user-select: none;
`;

const Row = styled.div`
  bottom: 0;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 0.6vw;
`;
