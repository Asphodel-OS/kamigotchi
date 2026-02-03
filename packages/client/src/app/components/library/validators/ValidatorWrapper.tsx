import { useVisibility, Validators } from 'app/stores';
import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { ExitButton } from '../modals/ExitButton';

// ValidatorWrapper is an animated wrapper around all validators.
// It includes and exit button with a click sound as well as Content formatting.
export const ValidatorWrapper = ({
  id,
  canExit,
  divName,
  title,
  children,
  subtitle,
  errorPrimary,
  errorSecondary,
}: {
  id: string;
  canExit?: boolean;
  divName: keyof Validators;
  title: string;
  children: React.ReactNode;
  subtitle?: string;
  errorPrimary?: string;
  errorSecondary?: string;
}) => {
  const isVisible = useVisibility((s) => s.validators[divName]);

  // update modal visibility according to store settings
  useEffect(() => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = isVisible ? 'block' : 'none';
    }
  }, [isVisible]);

  return (
    <Wrapper id={id} isOpen={isVisible}>
      {canExit && (
        <ButtonRow>
          <ExitButton divName={id} isValidator />
        </ButtonRow>
      )}
      <Content>
        <Header>
          <Title>{title}</Title>
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
          {errorPrimary && <ErrorPrimary>{errorPrimary}</ErrorPrimary>}
          {errorSecondary && <ErrorSecondary>{errorSecondary}</ErrorSecondary>}
        </Header>
        <Children>{children}</Children>
      </Content>
    </Wrapper>
  );
};

// Wrapper is an invisible animated wrapper around all validators sans frills.
interface Wrapper {
  isOpen: boolean;
}
const Wrapper = styled.div<Wrapper>`
  display: none;
  opacity: ${({ isOpen }) => (isOpen ? '1' : '0')};
  animation: ${({ isOpen }) => (isOpen ? fadeIn : fadeOut)} 0.5s ease-in-out;
  transition: opacity 0.5s ease-in-out;
  pointer-events: ${({ isOpen }) => (isOpen ? 'auto' : 'none')};
  z-index: 20;
  max-height: 100%;
  max-width: 100%;
  user-select: none;
`;

const Content = styled.div`
  position: relative;
  background-color: white;
  border: solid black 0.15em;
  border-radius: 1.2em;

  padding: 2em 4em;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
  align-items: center;

  overflow: hidden scroll;
  ::-webkit-scrollbar {
    -webkit-appearance: none;
    width: 1.5cqi;
  }
  ::-webkit-scrollbar-thumb {
    border-radius: 5cqi;
    background-color: rgba(0, 0, 0, 0.5);
  }
`;

const Header = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: center;
  padding: 0.3em;
  width: 100%;
`;

const Title = styled.div`
  color: #333;
  padding: 0.6em;
  font-size: 1.5em;
  text-align: center;
`;

const Subtitle = styled.div`
  color: #666;
  padding: 0.6em;
  font-size: 1em;
  text-align: center;
`;

const ErrorPrimary = styled.div`
  color: #922;
  padding: 0.45em;
  font-size: 1.2em;
  line-height: 2.1em;
  text-align: center;
`;

const ErrorSecondary = styled.div`
  color: #922;
  padding: 0.45em;
  font-size: 0.9em;
  line-height: 1.2em;
  text-align: center;
`;

const Children = styled.div`
  max-height: 100%;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  font-size: 0.8em;
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

const ButtonRow = styled.div`
  position: absolute;
  padding: 0.7em;
  right: 0;
  display: inline-flex;
`;

export { Wrapper as ValidatorWrapperLite };
