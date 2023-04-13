import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

import { ExitButton } from 'layers/react/components/library/ExitButton';
import { dataStore, VisibleModals } from 'layers/react/store/createStore';


interface Props {
  divName: keyof VisibleModals;
  id: string;
  fill?: boolean; // whether the content should fit to the entire modal
  children: React.ReactNode;
}


// ModalWrapperFull is an animated wrapper around all modals.
// It includes and exit button with a click sound as well as Content formatting.
export const ModalWrapperFull = (props: Props) => {
  const { visibleModals } = dataStore();

  // Updates modal visibility if the divName is updated to visible in the store.
  useEffect(() => {
    const element = document.getElementById(props.id);
    if (element) {
      const isVisible = visibleModals[props.divName];
      element.style.display = isVisible ? 'block' : 'none';
    }
  }, [visibleModals[props.divName]]);

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
        <ExitButton divName={props.divName} />
        {props.children}
      </Content>
    </Wrapper>
  );
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
  border-color: black;
  border-width: 2px;
  border-radius: 10px;
  border-style: solid;
  background-color: white;
  padding: 8px;
  width: 99%;

  display: flex;
  flex-flow: column nowrap;
  font-family: Pixel;
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

// NOTE: this is not actually used atm as we set display:none on close. This is
// done to avoid having active, invisible buttons lingering on the UI after close.
const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

export { Wrapper as ModalWrapperLite };
