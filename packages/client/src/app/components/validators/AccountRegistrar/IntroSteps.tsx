import styled from 'styled-components';
import { BackButton, Description, NextButton, Row } from './components';
import { Section } from './components/shared';

export const IntroStep1 = ({
  step,
  setStep,
}: {
  step: number;
  setStep: (step: number) => void;
}) => {

  return (
    <Container>
      <Section padding={0.9}>
        <Description size={0.9}>Welcome to Kamigotchi World.</Description>
        <Description size={0.9}>This world exists entirely on-chain.</Description>
      </Section>
      <Row>
        <NextButton step={step} setStep={setStep} />
      </Row>
    </Container>
  );
};

export const IntroStep2 = ({
  step,
  setStep,
}: {
  step: number;
  setStep: (step: number) => void;
}) => {

  return (
    <Container>
      <Section padding={0.9}>
        <Description size={0.9}>Kamigotchi are key to this world.</Description>
        <Description size={0.9}>You will need them to progress.</Description>
      </Section>
      <Row>
        <BackButton step={step} setStep={setStep} />
        <NextButton step={step} setStep={setStep} />
      </Row>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: center;

  user-select: none;
`;
