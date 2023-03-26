import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

import clickSoundUrl from 'assets/sound/fx/mouseclick.wav';
import { ExitButton } from 'layers/react/components/library/ExitButton';
import { dataStore, VisibleModals } from 'layers/react/store/createStore';

// ModalWrapperFull is an animated wrapper around all modals.
// It includes and exit button with a click sound as well as Content formatting.
export const ModalWrapperFull = (props: Props) => {
  const {
    visibleModals,
    setVisibleModals,
    sound: { volume },
  } = dataStore();

  // Updates modal visibility if the divName is updated to visible in the store.
  useEffect(() => {
    const element = document.getElementById(props.id);
    if (element) {
      const isVisible = visibleModals[props.divName];
      element.style.display = isVisible ? 'block' : 'none';
    }
  }, [visibleModals[props.divName], props.id]);

  // closes the modal
  const handleClose = () => {
    const clickSound = new Audio(clickSoundUrl);
    clickSound.volume = volume * 0.6;
    clickSound.play();
    setVisibleModals({ ...visibleModals, [props.divName]: false });
  };

  // Some conditional styling to adapt the content to the wrapper.
  const wrapperStyle = props.fill ? { height: '75vh' } : {};
  const contentStyle = props.fill ? { height: '100%' } : {};

  return (
    <Wrapper
      id={props.id}
      isOpen={visibleModals[props.divName]}
      style={wrapperStyle}
    >
      <Content style={contentStyle}>
        <ExitButton onClick={handleClose} />
        {props.children}
      </Content>
    </Wrapper>
  );
}

interface Props {
  divName: keyof VisibleModals;
  id: string;
  fill?: boolean; // whether the content should fit to the entire modal
  children: React.ReactNode;
}

interface Wrapper {
  isOpen: boolean;
}

// Wrapper is an invisible animated wrapper around all modals sans any frills.
const Wrapper = styled.div<Wrapper>`
  display: none;
  justify-content: center;
  align-items: center;
  opacity: ${({ isOpen }) => (isOpen ? '1' : '0')};
  animation: ${({ isOpen }) => (isOpen ? fadeIn : fadeOut)} 0.5s ease-in-out;
  transition: opacity 0.5s ease-in-out;
  pointer-events: ${({ isOpen }) => (isOpen ? 'auto' : 'none')};
`;

const Content = styled.div`
  display: grid;
  background-color: white;
  border-radius: 10px;
  padding: 8px;
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

export { Wrapper as ModalWrapperLite };