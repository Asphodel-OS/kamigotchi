import styled from 'styled-components';

const lightningSize = '14px';

type BatteryLevelProps = {
  level: number;
};

const Battery = styled.div`
  border: 3px solid #333;
  width: 18px;
  height: 28px;
  padding: 2px;
  border-radius: 4px;
  position: relative;
  margin-right: 2px;
  transform: rotate(90deg);

  &:before {
    content: '';
    height: 3px;
    width: 10px;
    background: #333;
    display: block;
    position: absolute;
    top: -6px;
    border-radius: 4px 4px 0 0;
  }

  &:after {
    content: '';
    display: block;
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    border: 1px solid #fff;
    border-radius: 2px;
  }
`;

const BatteryLevel = styled.div<BatteryLevelProps>`
  background: ${(props) => {
    if (props.level <= 10) {
      return '#e81309';
    } else if (props.level <= 20) {
      return '#efaf13';
    } else {
      return '#30b455';
    }
  }};
  position: absolute;
  bottom: 0px;
  left: 0;
  right: 0;
  height: ${(props) => (props.level ? `${props.level}%` : '100%')};

  &.warn {
    background-color: #efaf13;
  }

  &.alert {
    background-color: #e81309;

    &:before {
      background-image: url('data:image/svg+xml;charset=US-ASCII,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%3C!DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%20%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%3Csvg%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%3E%3Cg%3E%3C%2Fg%3E%20%3Cpath%20fill%3D%22%23e81309%22%20d%3D%22M17.927%2012l2.68-10.28c0.040-0.126%200.060-0.261%200.060-0.4%200-0.726-0.587-1.32-1.314-1.32-0.413%200-0.78%200.187-1.019%200.487l-13.38%2017.353c-0.18%200.227-0.287%200.513-0.287%200.827%200%200.733%200.6%201.333%201.333%201.333h8.073l-2.68%2010.28c-0.041%200.127-0.060%200.261-0.060%200.4%200.001%200.727%200.587%201.32%201.314%201.32%200.413%200%200.78-0.186%201.020-0.487l13.379-17.353c0.181-0.227%200.287-0.513%200.287-0.827%200-0.733-0.6-1.333-1.333-1.333h-8.073z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E');
      background-repeat: no-repeat;
      background-size: ${lightningSize};
      height: ${lightningSize};
      width: ${lightningSize};
      margin: -25px 0 0 2px;
      content: '';
      display: inline-block;
      position: absolute;
    }
  }
`;

const BatteryContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 10px;
  font-size: 14px;
`;

export const BatteryComponent: React.FC<BatteryLevelProps> = ({ level }) => {
  return (
    <BatteryContainer>
      <span>{level} %</span>
      <Battery>
        <BatteryLevel level={level} />
      </Battery>
    </BatteryContainer>
  );
};
