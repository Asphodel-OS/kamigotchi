import styled from 'styled-components';
import { playClick } from 'utils/sounds';

interface Props {
  button: {
    text: string;
    onClick: (value: number) => void;
    disabled: boolean;
    tooltip: string[];
  };
  input: {
    value: number;
    setValue: (value: number) => void;
    max: number;
    min: number;
    step: number;
  };
}

export const InputButton = (props: Props) => {
  const { button, input } = props;
  const { text, onClick, disabled, tooltip } = button;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const quantityStr = event.target.value.replace('[^d.]/g', '');
    const rawValue = parseFloat(quantityStr || '0');
    console.log(event.target.value, quantityStr, rawValue);
    const value = Math.max(input.min, Math.min(input.max, rawValue));
    input.setValue(value);
  };

  const handleSubmit = () => {
    onClick(input.value);
    playClick();
  };

  return (
    <Container>
      <Input
        type='number'
        step={input.step}
        value={input.value.toFixed(3)}
        onChange={(e) => handleChange(e)}
      />
      <Button onClick={handleSubmit} disabled={button.disabled}>
        {text}
      </Button>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border: 0.15vw solid black;
  border-radius: 0.45vw;
  width: 21vw;
  height: 4.5vw;

  display: flex;
  flex-direction: row nowrap;
  align-items: center;
`;

const Input = styled.input`
  background-color: #eee;
  border: none;
  border-radius: 0.45vw 0 0 0.45vw;
  width: 7.5vw;
  height: 100%;

  padding: 0.3vw;
  margin: 0w;
  cursor: text;
  color: black;
  font-size: 1.2vw;
  text-align: center;
`;

const Button = styled.div<{ disabled: boolean }>`
  background-color: #eee;
  border-left: 0.15vw solid black;
  border-radius: 0 0.45vw 0.45vw 0;

  width: 100%;
  height: 100%;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;

  font-size: 1.5vw;

  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
`;
