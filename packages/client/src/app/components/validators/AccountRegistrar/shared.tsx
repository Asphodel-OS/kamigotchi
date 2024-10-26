import styled from 'styled-components';

import { ActionButton } from 'app/components/library';

interface Props {
  step: number;
  setStep: (step: number) => void;
}

export const BackButton = (props: Props) => {
  const { step, setStep } = props;
  return <ActionButton text='Back' disabled={step === 0} onClick={() => setStep(step - 1)} />;
};

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 0.3vw;
  margin-top: 0.45vw;
`;

export const Description = styled.p`
  color: #333;
  padding: 0.3vw 0;
  font-size: 0.75vw;
  text-align: center;
`;
