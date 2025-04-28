import { ActionButton } from 'app/components/library';

interface Props {
  step: number;
  setStep: (step: number) => void;
}

export const NextButton = (props: Props) => {
  const { step, setStep } = props;
  return <ActionButton text='Next' onClick={() => setStep(step + 1)} />;
};
