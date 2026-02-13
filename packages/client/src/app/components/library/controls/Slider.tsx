import styled from 'styled-components';

export const Slider = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  width = '4.5vw',
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  width?: string;
}) => {
  return (
    <Column>
      <Label>{label}</Label>
      <Input
        type='range'
        min={min}
        max={max}
        step={step}
        value={value}
        $width={width}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <Value>{value}</Value>
    </Column>
  );
};

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2vw;
`;

const Label = styled.span`
  font-size: 0.7vw;
  font-weight: bold;
`;

const Input = styled.input<{ $width: string }>`
  width: ${({ $width }) => $width};
  height: 0.4vw;
  cursor: pointer;
  accent-color: rgb(203, 186, 61);
`;

const Value = styled.span`
  font-size: 0.7vw;
`;
