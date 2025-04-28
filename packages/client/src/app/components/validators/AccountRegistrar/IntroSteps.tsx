import { BackButton, Description, NextButton, Row } from './components';

export interface Props {
  step: number;
  setStep: (step: number) => void;
}

export const IntroStep1 = (props: Props) => {
  const { step, setStep } = props;

  return (
    <>
      <br />
      <Description>Welcome to Kamigotchi World.</Description>
      <Description>This world exists entirely on-chain.</Description>
      <br />
      <Row>
        <NextButton step={step} setStep={setStep} />
      </Row>
    </>
  );
};

export const IntroStep2 = (props: Props) => {
  const { step, setStep } = props;

  return (
    <>
      <br />
      <Description>Kamigotchi are key to this world.</Description>
      <Description>You will need them to progress.</Description>
      <br />
      <Row>
        <BackButton step={step} setStep={setStep} />
        <NextButton step={step} setStep={setStep} />
      </Row>
    </>
  );
};
