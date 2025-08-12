import { ActionButton } from 'app/components/library';

export const BackButton = ({
  step,
  setStep,
}: {
  step: number
  setStep: (step: number) => void
}) => {
  return <ActionButton text='Back' disabled={step === 0} onClick={() => setStep(step - 1)} />;
};
