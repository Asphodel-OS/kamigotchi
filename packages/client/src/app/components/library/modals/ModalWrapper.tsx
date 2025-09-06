import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

import { Modals, useVisibility } from 'app/stores';
import { ExitButton } from './ExitButton';

// ModalWrapper is an animated wrapper around all modals.
// It includes and exit button with a click sound as well as Content formatting.
export const ModalWrapper = ({
  id,
  children,
  header,
  footer,
  canExit,
  overlay,
  noInternalBorder,
  noPadding,
  truncate,
  scrollBarColor,
  positionOverride,
}: {
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
  positionOverride?: {
    colStart: number;
    colEnd: number;
    rowStart: number;
    rowEnd: number;
    position: 'fixed' | 'absolute';
  };
}) => {
  const isVisible = useVisibility((s) => s.modals[id]);
  const [gridStyle, setGridStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (positionOverride) {
      const { colStart, colEnd, rowStart, rowEnd, position } = positionOverride;
      setGridStyle({
        left: `${colStart}vw`,
        right: `${colEnd}vw`,
        top: `${rowStart}vh`,
        bottom: `${rowEnd}vh`,
        position,
        width: `${colEnd - colStart}vw`,
        height: `${rowEnd - rowStart}vh`,
      });
    } else {
      setGridStyle({});
    }
  }, [positionOverride]);

  return (
    <Wrapper id={id} isOpen={isVisible} overlay={!!overlay} style={gridStyle}>
      <Content isOpen={isVisible} truncate={truncate}>
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

// Wrapper is an invisible animated wrapper around all modals sans any frills.
const Wrapper = styled.div<{
  isOpen: boolean;
  overlay: boolean;
}>`
  display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
  animation: ${({ isOpen }) => (isOpen ? fadeIn : fadeOut)} 0.5s ease-in-out;
  position: ${({ overlay }) => (overlay ? 'relative' : 'static')};
  z-index: ${({ overlay }) => (overlay ? 3 : 0)};

  margin: 0.2vw;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const Content = styled.div<{
  isOpen: boolean;
  truncate?: boolean;
}>`
  position: relative;
  background-color: white;
  border: solid black 0.15vw;
  border-radius: 1.2vw;

  width: 100%;
  ${({ truncate }) => (truncate ? `max-height: 100%;` : `height: 100%;`)}
  pointer-events: ${({ isOpen }) => (isOpen ? 'auto' : 'none')};

  display: flex;
  flex-flow: column nowrap;
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
  border-radius: 1.05vw 1.05vw 0 0;
  display: flex;
  flex-flow: column nowrap;
`;

const Footer = styled.div<{ noBorder?: boolean }>`
  ${({ noBorder }) => (noBorder ? '' : 'border-top: solid black 0.15vw;')}
  border-radius: 0 0 1.05vw 1.05vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Children = styled.div<{
  noPadding?: boolean;
  scrollBarColor?: string;
}>`
  position: relative;
  overflow-y: auto;
  max-height: 100%;
  height: 100%;
  ${({ scrollBarColor }) => scrollBarColor && `scrollbar-color:${scrollBarColor};`}
  display: flex;
  flex-flow: column nowrap;
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
