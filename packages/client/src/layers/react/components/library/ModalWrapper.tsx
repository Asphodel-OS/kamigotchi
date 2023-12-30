import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

import { ExitButton } from 'layers/react/components/library/ExitButton';
import { useVisibility, Modals } from 'layers/react/store/visibility';

interface Props {
  id: string;
  divName: keyof Modals;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  canExit?: boolean;
  overlay?: boolean;
}

// ModalWrapper is an animated wrapper around all modals.
// It includes and exit button with a click sound as well as Content formatting.
export const ModalWrapper = (props: Props) => {
  const { divName, id, children, header, footer, canExit, overlay } = props;
  const { modals } = useVisibility();

  // update modal visibility according to store settings
  useEffect(() => {
    const element = document.getElementById(id);
    if (element) {
      const isVisible = modals[divName];
      element.style.display = isVisible ? 'block' : 'none';
    }
  }, [modals[divName]]);

  // catch clicks on modal, prevents duplicate Phaser3 triggers
  const handleClicks = (event: any) => {
    event.stopPropagation();
  }
  const element = document.getElementById(id);
  element?.addEventListener('mousedown', handleClicks);

  // conditional stlying for modals overlayed on top
  const zindex = overlay ? { position: 'relative', zIndex: '2' } : {};


  return (
    <Wrapper
      id={id}
      isOpen={modals[divName]}
      style={{ ...zindex }}
    >
      <Content>
        {canExit &&
          <ButtonRow>
            <ExitButton divName={divName} />
          </ButtonRow>
        }
        {header && <Header>{header}</Header>}
        <Children>{children}</Children>
        {footer && <Footer>{footer}</Footer>}
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
  border: solid black 2px;
  border-radius: 10px;

  background-color: white;
  width: 99%;
  height: 99%;
  
  display: flex;
  flex-flow: column nowrap;
  font-family: Pixel;
`;

const ButtonRow = styled.div`
  position: absolute;
  
  display: inline-flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-self: flex-end;
`;

const Header = styled.div`
  border-radius: 10px 10px 0px 0px;
  border-bottom: solid black .15vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Footer = styled.div`  
  border-radius: 0px 0px 10px 10px;
  border-top: solid black .15vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Children = styled.div`
  padding: .4vw;
  overflow-y: scroll;
  max-height: 100%;
  height: 100%;
  
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
