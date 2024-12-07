import { useVisibility, Validators } from 'app/stores';
import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

interface Props {
  id: string;
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
  const { id, divName, title, subtitle, children, errorPrimary, errorSecondary } = props;

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
  justify-content: center;
  align-items: center;
  opacity: ${({ isOpen }) => (isOpen ? '1' : '0')};
  animation: ${({ isOpen }) => (isOpen ? fadeIn : fadeOut)} 0.5s ease-in-out;
  transition: opacity 0.5s ease-in-out;
  pointer-events: ${({ isOpen }) => (isOpen ? 'auto' : 'none')};
  z-index: 20;
`;

const Content = styled.div`
  position: fixed;
  background-color: white;
  border: solid black 0.15vw;
  border-radius: 1.2vw;

  padding: 2vw 4vw;
  width: fit-content;
  height: fit-content;
  --height: 25em;
  left: 31.4%;
  top: max(calc((100vh - var(--height)) / 2), 0vh);

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
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
  font-size: 1.5vw;
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
  font-size: 0.9vw;
  text-align: center;
`;

const ErrorSecondary = styled.div`
  color: #922;
  padding: 0.45vw;
  font-size: 0.9vw;
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

export { Wrapper as ValidatorWrapperLite };
