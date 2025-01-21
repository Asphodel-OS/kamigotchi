import styled from 'styled-components';
import initia from '../../../../../assets/images/items/initia_icon.png';

export const VipScore = () => {
  return (
    <Row>
      <img style={{ height: '1.3vw', width: '1.3vw' }} src={initia} alt='initia' />
      <div style={{ fontSize: '0.7vw' }}>0 VIP score</div>
    </Row>
  );
};

const Row = styled.div`
  display: flex;
  margin: 0.5vw 01vw;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  --width: 12.5vw;
  position: relative;
  right: 6%;
  gap: 0.25vw;
`;
