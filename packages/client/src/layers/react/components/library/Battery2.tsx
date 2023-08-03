import styled from 'styled-components';


type BatteryProps = {
  level: number;
};

const BatteryContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const BatteryShell = styled.div` 
  border-radius: .25vw;
  border: .15vw solid #444;
  width: 1.5vw;
  height: 1vw;
  padding: .05vw;

  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
`;

const BatteryJuice = styled.div`
  border-radius: .1vw;
`;

const BatteryBump = styled.div`
  background-color: #444;
  margin: .05vw;
  width: .1vw;
  height: .3vw;
`;

const getColor = (level: number) => {
  if (level <= 20) return '#FF6600';
  if (level <= 50) return '#FFD000';
  return '#23AD41';
}

export const Battery2 = (props: BatteryProps) => {
  const juiceStyles = {
    backgroundColor: getColor(props.level),
    width: `${props.level + 5}%`,
  }
  return (
    <BatteryContainer>
      <BatteryShell><BatteryJuice style={juiceStyles} /></BatteryShell>
      <BatteryBump />
    </BatteryContainer>
  );
};
