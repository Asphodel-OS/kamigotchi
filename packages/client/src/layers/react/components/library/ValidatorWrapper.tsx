import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

import { useComponentSettings, Validators } from 'layers/react/store/componentSettings';

interface Props {
  id: string;
  divName: keyof Validators;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  header?: React.ReactNode;
}

// ValidatorWrapper is an animated wrapper around all validators.
// It includes and exit button with a click sound as well as Content formatting.
export const ValidatorWrapper = (props: Props) => {
  const { validators } = useComponentSettings();
  const { id, divName, title, subtitle, children } = props;

  // update modal visibility according to store settings
  useEffect(() => {
    const element = document.getElementById(id);
    if (element) {
      const isVisible = validators[divName];
      element.style.display = isVisible ? 'block' : 'none';
    }
  }, [validators[divName]]);

  // catch clicks on modal, prevents duplicate Phaser3 triggers
  const handleClicks = (event: any) => {
    event.stopPropagation();
  }
  const element = document.getElementById(id);
  element?.addEventListener('mousedown', handleClicks);


  return (
    <Wrapper
      id={id}
      isOpen={validators[divName]}
    >
      <Content>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
        <Children>{children}</Children>
      </Content>
    </Wrapper>
  );
};


// Wrapper is an invisible animated wrapper around all validators sans frills.
interface Wrapper { isOpen: boolean };
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
  border: solid black 2px;
  border-radius: 10px;
  background-color: white;

  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 100%;
  max-height: 100%;
  padding: 3vh 5vw;
  
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  font-family: Pixel;
`;


const Title = styled.div`
  font-size: 24px;
  color: #333;
  padding: 15px;
  text-align: center;
  font-family: Pixel;
`;

const Subtitle = styled.div`
  font-size: 14px;
  color: #666;
  text-align: center;
  font-family: Pixel;
  padding: 5px;
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

export { Wrapper as ValidatorWrapperLite };
