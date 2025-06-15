import { useVisibility, Validators } from 'app/stores';
import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { ExitButton } from '../modals/ExitButton';

interface Props {
  id: string;
  canExit?: boolean;
  divName: keyof Validators;
  title: string;
  children: React.ReactNode;
  subtitle?: string;
  errorPrimary?: string;
  errorSecondary?: string;
}

// ValidatorWrapper is an animated wrapper around all validators.
// It includes and exit button with a click sound as well as Content formatting.
export const ValidatorWrapper = (props: Props) => {
  const { validators } = useVisibility();
  const { id, divName, title, subtitle, children, errorPrimary, errorSecondary, canExit } = props;

  // update modal visibility according to store settings
  useEffect(() => {
    const element = document.getElementById(id);
    if (element) {
      const isVisible = validators[divName];
      element.style.display = isVisible ? 'block' : 'none';
    }
  }, [validators[divName]]);

  return (
    <Wrapper id={id} isOpen={validators[divName]}>
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
  position: fixed;
  opacity: ${({ isOpen }) => (isOpen ? '1' : '0')};
  animation: ${({ isOpen }) => (isOpen ? fadeIn : fadeOut)} 0.5s ease-in-out;
  transition: opacity 0.5s ease-in-out;
  pointer-events: ${({ isOpen }) => (isOpen ? 'auto' : 'none')};
  z-index: 20;

  width: 50vw;
  height: 50vh;
  left: 25vw;
  top: 25vh;

  user-select: none;
`;

const Content = styled.div`
  position: relative;
  background-color: white;
  border: solid black 0.15vw;
  border-radius: 1.2vw;

  padding: 2vw 4vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
  align-items: center;
`;

const Header = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: center;
  padding: 0.3vw;
  width: 100%;
`;

const Title = styled.div`
  color: #333;
  padding: 0.6vw;
  font-size: 2.1vw;
  text-align: center;
`;

const Subtitle = styled.div`
  color: #666;
  padding: 0.6vw;
  font-size: 1.2vw;
  text-align: center;
`;

const ErrorPrimary = styled.div`
  color: #922;
  padding: 0.45vw;
  font-size: 1.2vw;
  line-height: 2.1vw;
  text-align: center;
`;

const ErrorSecondary = styled.div`
  color: #922;
  padding: 0.45vw;
  font-size: 0.9vw;
  line-height: 1.2vw;
  text-align: center;
`;

const Children = styled.div`
  max-height: 100%;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;
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
  padding: 0.7vw;
  right: 0;
  display: inline-flex;
`;
export { Wrapper as ValidatorWrapperLite };
