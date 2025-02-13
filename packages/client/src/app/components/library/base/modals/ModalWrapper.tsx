import React from 'react';
import styled, { keyframes } from 'styled-components';

import { Modals, useVisibility } from 'app/stores';
import { ExitButton } from './ExitButton';

interface Props {
  id: keyof Modals;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  canExit?: boolean;
  overlay?: boolean;
  noInternalBorder?: boolean;
  noPadding?: boolean;
  truncate?: boolean;
  scrollBarColor?: string;
  width?: string;
}

// ModalWrapper is an animated wrapper around all modals.
// It includes and exit button with a click sound as well as Content formatting.
export const ModalWrapper = (props: Props) => {
  const { id, children, header, footer } = props;
  const { canExit, noInternalBorder, noPadding, overlay, truncate, scrollBarColor, width } = props;
  const { modals } = useVisibility();

  return (
    <Wrapper id={id} isOpen={modals[id]} overlay={!!overlay}>
      <Content truncate={truncate} width={width}>
        {canExit && (
          <ButtonRow>
            <ExitButton divName={id} />
          </ButtonRow>
        )}
        {header && <Header noBorder={noInternalBorder}>{header}</Header>}
        <Children scrollBarColor={scrollBarColor} noPadding={noPadding}>
          {children}
        </Children>
        {footer && <Footer noBorder={noInternalBorder}>{footer}</Footer>}
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

  margin: 0.2vw;
  align-items: center;
  justify-content: center;
`;

const Content = styled.div<{ truncate?: boolean; width?: string }>`
  position: relative;
  background-color: white;
  border: solid black 0.15vw;
  border-radius: 1.2vw;

  ${({ width }) => (width ? `width:${width};` : `width: 100%;`)}
  ${({ truncate }) => (truncate ? `max-height: 100%;` : `height: 100%;`)}

  display: flex;
  flex-flow: column nowrap;
  font-family: Pixel;
  overflow: hidden;
`;

const ButtonRow = styled.div`
  position: absolute;
  padding: 0.6vw;

  display: inline-flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-self: flex-end;
`;

const Header = styled.div<{ noBorder?: boolean }>`
  ${({ noBorder }) => (noBorder ? '' : 'border-bottom: solid black 0.15vw;')}
  border-radius: 1.2vw 1.2vw 0 0;
  display: flex;
  flex-flow: column nowrap;
`;

const Footer = styled.div<{ noBorder?: boolean }>`
  ${({ noBorder }) => (noBorder ? '' : 'border-top: solid black 0.15vw;')}
  border-radius: 0 0 1.2vw 1.2vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Children = styled.div<{
  noPadding?: boolean;
  scrollBarColor?: string;
}>`
  position: relative;
  overflow-y: auto;
  max-height: 57.9vh;
  height: fit-content;
  ${({ scrollBarColor }) => scrollBarColor && `scrollbar-color:${scrollBarColor};`}
  display: flex;
  flex-flow: column nowrap;
  font-family: Pixel;
  padding: ${({ noPadding }) => (noPadding ? `0` : `.6vw`)};
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
