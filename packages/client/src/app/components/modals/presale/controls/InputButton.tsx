import { Overlay, TextTooltip } from 'app/components/library';
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
  balance: number; // eth balance
}

export const InputButton = (props: Props) => {
  const { button, input, balance } = props;

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

  // set the input value to the max biddable amount
  const setValueToMax = () => {
    const maxBiddable = Math.min(balance, input.max);
    input.setValue(maxBiddable);
    playClick();
  };

  const getMaxTooltip = () => {
    let tooltip = ['Feeling bullish?'];
    if (balance < input.max) {
      tooltip = tooltip.concat([
        '',
        `You need ${input.max.toFixed(3)}ETH but only have ${balance.toFixed(3)}`,
        'Looks like.. your size is not size.',
      ]);
    }
    return tooltip;
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <Overlay right={0.3} top={-1}>
        <Text size={0.6}>{button.subtext}</Text>
      </Overlay>
      <Input
        type='number'
        step={input.step}
        value={input.value}
        onChange={(e) => handleChange(e)}
      />
      <Overlay left={7} bottom={0.1}>
        <TextTooltip text={getMaxTooltip()} alignText='center' grow>
          <ClickableText size={0.6} onClick={setValueToMax}>
            Max
          </ClickableText>
        </TextTooltip>
      </Overlay>
      <TextTooltip text={button.tooltip} alignText='center' grow>
        <Button onClick={handleSubmit} disabled={button.disabled}>
          {button.text}
        </Button>
      </TextTooltip>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border: 0.15vw solid black;
  border-radius: 0.6vw;
  width: 21vw;
  height: 4.5vw;

  display: flex;
  flex-direction: row nowrap;
  align-items: space-between;
`;

const Input = styled.input`
  background-color: #eee;
  border: none;
  border-radius: 0.45vw 0 0 0.45vw;
  width: 9vw;
  height: 100%;

  padding: 0.3vw;
  margin: 0w;
  cursor: text;
  color: black;
  font-size: 1.2vw;
  text-align: center;

  outline: none;
`;

const Button = styled.div<{ disabled: boolean }>`
  background-color: ${(props) => (props.disabled ? '#bbb' : '#112535')};
  border-left: 0.15vw solid black;
  border-radius: 0 0.45vw 0.45vw 0;

  width: 100%;
  height: 100%;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;

  color: #d0fe41;
  font-size: 1.5vw;

  cursor: pointer;
  pointer-events: ${(props) => (props.disabled ? 'none' : 'auto')};
  user-select: none;
  &:hover {
    background-color: #182630;
  }
  &:active {
    opacity: 0.6;
  }
`;

const Text = styled.div<{ size: number }>`
  color: #d0fe41;
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
`;

const ClickableText = styled.div<{ size: number }>`
  color: black;
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
`;
