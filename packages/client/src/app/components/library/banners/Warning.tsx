import styled from 'styled-components';
import { ActionButton } from '../buttons';
import { TextTooltip } from '../poppers/TextTooltip';

export interface Props {
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
}

export const Warning = (props: Props) => {
  const { text, color, tooltip, action } = props;

  return (
    <Container color={color ?? 'orange'} size={text.size ?? 0.9}>
      <TextTooltip text={tooltip ?? []}>
        <Text size={text.size ?? 0.9} color={text.color ?? 'black'}>
          {text.value}
        </Text>
      </TextTooltip>
      {action && <ActionButton onClick={action.onClick} text={action.label ?? 'Fix'} />}
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
