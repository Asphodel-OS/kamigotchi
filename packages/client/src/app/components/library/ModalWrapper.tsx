import React from 'react';
import styled, { keyframes } from 'styled-components';

import { ExitButton } from 'app/components/library';
import { Modals, useVisibility } from 'app/stores';

interface Props {
  id: keyof Modals;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  canExit?: boolean;
  overlay?: boolean;
  noPadding?: boolean;
}

// ModalWrapper is an animated wrapper around all modals.
// It includes and exit button with a click sound as well as Content formatting.
export const ModalWrapper = (props: Props) => {
  const { id, children, header, footer, canExit, overlay, noPadding } = props;
  const { modals } = useVisibility();

  return (
    <Wrapper id={id} isOpen={modals[id]} overlay={!!overlay}>
      <Content>
        {canExit && (
          <ButtonRow>
            <ExitButton divName={id} />
          </ButtonRow>
        )}
        {header && <Header>{header}</Header>}
        <Children noPadding={noPadding}>{children}</Children>
        {footer && <Footer>{footer}</Footer>}
      </Content>
    </Wrapper>
  );
};

interface Wrapper {
  isOpen: boolean;
  overlay: boolean;
}

// Wrapper is an invisible animated wrapper around all modals sans any frills.
const Wrapper = styled.div<Wrapper>`
  display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
  animation: ${({ isOpen }) => (isOpen ? fadeIn : fadeOut)} 0.5s ease-in-out;
  pointer-events: ${({ isOpen }) => (isOpen ? 'auto' : 'none')};
  position: ${({ overlay }) => (overlay ? 'relative' : 'static')};
  z-index: ${({ overlay }) => (overlay ? 2 : 0)};

  justify-content: center;
  align-items: center;
`;

const Content = styled.div`
  position: relative;
  border: solid black 0.15vw;
  border-radius: 0.6vw;

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
  border-bottom: solid black 0.15vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Footer = styled.div`
  border-radius: 0px 0px 10px 10px;
  border-top: solid black 0.15vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Children = styled.div<{ noPadding?: boolean }>`
  overflow-y: scroll;
  max-height: 100%;
  height: 100%;

  display: flex;
  flex-flow: column nowrap;
  font-family: Pixel;

  ${({ noPadding }) => (noPadding ? `padding: 0;` : `padding: .4vw;`)}
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// NOTE: this is not actually used atm as we set display:none on close. This is
// done to avoid having active, invisible buttons lingering on the UI after close.
const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

export { Wrapper as ModalWrapperLite };
