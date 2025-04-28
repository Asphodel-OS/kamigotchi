import { ActionButton } from 'app/components/library';

interface Props {
  step: number;
  setStep: (step: number) => void;
}

export const BackButton = (props: Props) => {
  const { step, setStep } = props;
  return <ActionButton text='Back' disabled={step === 0} onClick={() => setStep(step - 1)} />;
};
