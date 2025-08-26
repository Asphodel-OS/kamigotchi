import styled from 'styled-components';
import { ActionButton } from '../buttons';
import { TextTooltip } from '../poppers/TextTooltip';

export const Warning = ({
  text: {
    color: textColor = 'black',
    size: textSize = 0.9,
    value: textValue,
  },
  color = 'orange',
  tooltip = [],
  action: {
    onClick: actionOnClick,
    label: actionLabel = 'Fix',
  } = {}
}: {
  color?: string;
  text: {
    value: string;
    color?: string;
    size?: number;
  };
  tooltip?: string[];
  action?: {
    onClick: () => void;
    label?: string;
  };
}) => {

  return (
    <Container color={color} size={textSize}>
      <TextTooltip text={tooltip}>
        <Text size={textSize} color={textColor}>
          {textValue}
        </Text>
      </TextTooltip>
      {actionOnClick && <ActionButton onClick={actionOnClick} text={actionLabel} />}
    </Container>
  );
};

const Container = styled.div<{
  color: string;
  size: number;
}>`
  background-color: ${({ color }) => color};
  width: 100%;
  padding: ${({ size }) => size / 1.5}vw;
  gap: ${({ size }) => size / 1.5}vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;

const Text = styled.div<{
  color: string;
  size: number;
}>`
  color: ${({ color }) => color ?? 'black'};
  text-align: left;
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size }) => 1.5 * size}vw;
`;
