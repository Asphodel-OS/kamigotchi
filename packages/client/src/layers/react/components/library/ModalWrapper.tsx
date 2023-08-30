import React, { useCallback, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

import { ExitButton } from 'layers/react/components/library/ExitButton';
import { dataStore, VisibleModals } from 'layers/react/store/createStore';

interface Props {
  divName: keyof VisibleModals;
  id: string;
  children: React.ReactNode;
  header?: React.ReactNode;
  canExit?: boolean;
  overlay?: boolean;
  hideModal?: Partial<VisibleModals>;
}

// ModalWrapperFull is an animated wrapper around all modals.
// It includes and exit button with a click sound as well as Content formatting.
export const ModalWrapperFull = (props: Props) => {
  const { visibleModals, setVisibleModals } = dataStore();

  // Updates modal visibility if the divName is updated to visible in the store.
  // Closes other modals (if specified)
  useEffect(() => {
    const element = document.getElementById(props.id);
    if (element) {
      const isVisible = visibleModals[props.divName];
      element.style.display = isVisible ? 'block' : 'none';

      const toggleModal = props.hideModal ? props.hideModal : {};
      setVisibleModals({
        ...visibleModals,
        ...toggleModal
      });
    }
  }, [visibleModals[props.divName]]);

  // catch clicks on modal, prevents duplicate Phaser3 triggers
  const handleClicks = (event: any) => {
    event.stopPropagation();
  };
  const element = document.getElementById(props.id);
  element?.addEventListener('mousedown', handleClicks);

  // Some conditional styling to adapt the content to the wrapper.
  const zindex = props.overlay ? { position: 'relative', zIndex: '1' } : {};


  return (
    <Wrapper
      id={props.id}
      isOpen={visibleModals[props.divName]}
      style={{ ...zindex }}
    >
      <Content>
        {(props.canExit)
          ? <ButtonRow>
            <ExitButton divName={props.divName} />
          </ButtonRow>
          : null
        }
        {(props.header) ? <Header>{props.header}</Header> : null}
        <Children>{props.children}</Children>
      </Content>
    </Wrapper>
  );
};

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
  position: relative;
  border-color: black;
  border-width: 2px;
  border-radius: 10px;
  border-style: solid;

  background-color: white;
  width: 99%;
  height: 99%;
  
  display: flex;
  flex-flow: column nowrap;
  font-family: Pixel;
`;

const ButtonRow = styled.div`
  position: absolute;
  width: 100%;
  
  display: inline-flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
`;

const Header = styled.div`  
  border-radius: 10px 10px 0px 0px;
  display: flex;
`;

const Children = styled.div`
  margin: .3vw;
  overflow-y: scroll;
  max-height: 100%;
  
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
