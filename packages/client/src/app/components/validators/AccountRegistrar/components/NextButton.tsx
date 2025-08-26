import { ActionButton } from 'app/components/library';

export const NextButton = ({
  step,
  setStep,
}: {
  step: number
  setStep: (step: number) => void
}) => {
  return <ActionButton text='Next' onClick={() => setStep(step + 1)} />;
};
