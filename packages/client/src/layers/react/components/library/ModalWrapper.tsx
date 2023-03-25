import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

import clickSoundUrl from 'assets/sound/fx/mouseclick.wav';
import { ExitButton } from 'layers/react/components/library/ExitButton';
import { dataStore, VisibleDivs } from 'layers/react/store/createStore';

// ModalWrapperFull is an animated wrapper around all modals.
// It includes and exit button with a click sound as well as Content formatting.
export const ModalWrapperFull = (props: Props) => {
  const {
    visibleDivs,
    setVisibleDivs,
    sound: { volume },
  } = dataStore();

  // Updates modal visibility if the divName is updated to visible in the store.
  useEffect(() => {
    const element = document.getElementById(props.elementId);
    if (element && visibleDivs[props.divName]) {
      element.style.display = 'block';
    }
  }, [visibleDivs[props.divName], props.elementId]);

  // closes the modal
  const handleClose = () => {
    const clickSound = new Audio(clickSoundUrl);
    clickSound.volume = volume * 0.6;
    clickSound.play();
    setVisibleDivs({ ...visibleDivs, [props.divName]: false });
  };

  // Some conditional styling to adapt the content to the wrapper.
  const wrapperStyle = props.fill ? { height: '75vh' } : {};
  const contentStyle = props.fill ? { height: '100%' } : {};

  return (
    <ModalWrapperLite
      id={props.elementId}
      isOpen={visibleDivs[props.divName]}
      style={wrapperStyle}
    >
      <ModalContent style={contentStyle}>
        <ExitButton style={{ pointerEvents: 'auto' }} onClick={handleClose} />
        {props.children}
      </ModalContent>
    </ModalWrapperLite>
  );
}


interface Props {
  divName: keyof VisibleDivs;
  elementId: string;
  fill?: boolean; // whether the content should fit to the entire modal
  children: React.ReactNode;
}

interface ModalWrapperLite {
  isOpen: boolean;
}

// ModalWrapperLite is an invisible animated wrapper around all modals sans any frills.
export const ModalWrapperLite = styled.div<ModalWrapperLite>`
  display: none;
  justify-content: center;
  align-items: center;
  opacity: ${({ isOpen }) => (isOpen ? '1' : '0')};
  animation: ${({ isOpen }) => (isOpen ? fadeIn : fadeOut)} 0.5s ease-in-out;
  transition: opacity 0.5s ease-in-out;
  pointer-events: ${({ isOpen }) => (isOpen ? 'auto' : 'none')};
`;

const ModalContent = styled.div`
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