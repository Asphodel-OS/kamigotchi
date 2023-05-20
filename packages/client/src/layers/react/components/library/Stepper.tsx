import { Modal } from 'antd';
import { useState } from 'react';
import styled, { css } from 'styled-components';

const StepsWrapper = styled.div<any>`
  display: flex;
  align-items: center;
  ${(props) =>
    props.dialogue &&
    css`
      margin-right: 1%;
    `}
`;

const StepButton = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px;
  display: inline-block;
  font-size: 14px;
  cursor: pointer;
  border-radius: 5px;
  font-family: Pixel;

  &:active {
    background-color: #c4c4c4;
  }
`;

export const Stepper = (props: any) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { handleSubmit, name, submit } = props;

  const steps = typeof props.steps === 'function' ? props.steps(props) : props.steps;

  const handleNext = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <>
      {props.dialogue && (
        <StepsWrapper dialogue={props.dialogue}>
          {currentStep > 1 && (
            <StepButton style={{ pointerEvents: 'auto' }} onClick={handlePrevious}>
              Previous
            </StepButton>
          )}
          {currentStep < steps.length && (
            <StepButton style={{ pointerEvents: 'auto', marginLeft: 'auto' }} onClick={handleNext}>
              Next
            </StepButton>
          )}
        </StepsWrapper>
      )}

      {steps[currentStep - 1].content}
      {steps[currentStep - 1].modalContent && <Modal>{steps[currentStep - 1].content}</Modal>}

      {!props.dialogue && (
        <>
          {currentStep > 1 && (
            <StepButton style={{ pointerEvents: 'auto' }} onClick={handlePrevious}>
              Previous
            </StepButton>
          )}
          {currentStep < steps.length && (
            <StepButton style={{ pointerEvents: 'auto' }} onClick={handleNext}>
              Next
            </StepButton>
          )}
        </>
      )}

      {submit && currentStep === steps.length && (
        <StepButton
          style={{ pointerEvents: 'auto' }}
          onClick={() => {
            handleSubmit(name);
          }}
        >
          Submit
        </StepButton>
      )}
    </>
  );
};
