import { Overlay, Tooltip } from 'app/components/library';
import styled from 'styled-components';
import { playClick } from 'utils/sounds';

interface Props {
  button: {
    text: string;
    onClick: (value: number) => void;
    disabled: boolean;
    tooltip: string[];
    subtext: string;
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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const quantityStr = event.target.value.replace('[^d.]/g', '');
    const rawValue = parseFloat(quantityStr || '0');
    const value = Math.max(input.min, Math.min(input.max, rawValue));
    input.setValue(value);
  };

  const handleSubmit = () => {
    button.onClick(input.value);
    playClick();
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <Overlay right={0.3} top={-0.9}>
        <Text size={0.6}>{button.subtext}</Text>
      </Overlay>
      <Input
        type='number'
        step={input.step}
        value={input.value.toFixed(3)}
        onChange={(e) => handleChange(e)}
      />
      <Tooltip text={button.tooltip} alignText='center' grow>
        <Button onClick={handleSubmit} disabled={button.disabled}>
          {button.text}
        </Button>
      </Tooltip>
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
  align-items: space-between;
`;

const Input = styled.input`
  background-color: #eee;
  border: none;
  border-radius: 0.3vw 0 0 0.3vw;
  width: 7.5vw;
  height: 100%;

  padding: 0.3vw;
  margin: 0w;
  cursor: text;
  color: black;
  font-size: 1.2vw;
  text-align: center;

  box-shadow: inset 0.1vw 0.1vw 0.2vw #000;
  outline: none;
`;

const Button = styled.div<{ disabled: boolean }>`
  background-color: ${(props) => (props.disabled ? '#bbb' : '#fff')};
  border-left: 0.15vw solid black;
  border-radius: 0 0.3vw 0.3vw 0;

  width: 100%;
  height: 100%;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;

  box-shadow: 0.1vw 0.1vw 0.2vw #000;

  font-size: 1.5vw;

  cursor: pointer;
  pointer-events: ${(props) => (props.disabled ? 'none' : 'auto')};
  user-select: none;
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
`;
