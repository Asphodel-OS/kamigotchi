import React from 'react';
import styled, { keyframes } from 'styled-components';

import { Battery, Tooltip } from 'app/components/library';
import { Modals, useVisibility } from 'app/stores';
import { calcStaminaPercent } from 'network/shapes/Account';
import { Stat } from 'network/shapes/Stats';
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
  playerStamina?: Stat;
  getStaminaTooltip?: (stamina: Stat) => string[];
}

// ModalWrapper is an animated wrapper around all modals.
// It includes and exit button with a click sound as well as Content formatting.
export const ModalWrapper = (props: Props) => {
  const { id, children, header, footer, playerStamina, getStaminaTooltip } = props;
  const { canExit, noInternalBorder, noPadding, overlay, truncate } = props;
  const { modals } = useVisibility();

  return (
    <Wrapper id={id} isOpen={modals[id]} overlay={!!overlay}>
      <Content truncate={truncate}>
        {canExit && (
          <ButtonRow>
            {getStaminaTooltip && playerStamina && (
              <Tooltip text={getStaminaTooltip(playerStamina)}>
                <TextBox>
                  {`${calcStaminaPercent(playerStamina)}%`}
                  <Battery level={calcStaminaPercent(playerStamina)} scale={1.2} />
                </TextBox>
              </Tooltip>
            )}
            <ExitButton divName={id} />
          </ButtonRow>
        )}
        {header && <Header noBorder={noInternalBorder}>{header} </Header>}

        <Children noPadding={noPadding}>{children}</Children>
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

const Content = styled.div<{ truncate?: boolean }>`
  position: relative;
  background-color: white;
  border: solid black 0.15vw;
  border-radius: 1.2vw;

  width: 100%;
  ${({ truncate }) => (truncate ? `max-height: 100%;` : `height: 100%;`)}

  display: flex;
  flex-flow: column nowrap;
  font-family: Pixel;
`;

const ButtonRow = styled.div`
  position: absolute;
  padding: 0.6vw;
  display: inline-flex;
  flex-flow: row;
  justify-content: flex-end;
  align-self: flex-end;
  align-items: center;
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

const Children = styled.div<{ noPadding?: boolean }>`
  position: relative;
  overflow-y: auto;
  max-height: 100%;
  height: 100%;

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
const TextBox = styled.div`
  padding-right: 1vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  gap: 0.6vh;

  color: black;
  font-family: Pixel;
  font-size: 1.2vh;
`;

export { Wrapper as ModalWrapperLite };
