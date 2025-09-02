import { ItemImages } from 'assets/images/items';
import styled from 'styled-components';

export const VipScore = () => {
  return (
    <Row>
      <img style={{ height: '1.3em', width: '1.3em' }} src={ItemImages.init} alt='initia' />
      <div style={{ fontSize: '0.7em' }}>0 VIP score</div>
    </Row>
  );
};

const Row = styled.div`
  display: flex;
  margin: 0.5em 01em;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  --width: 12.5em;
  position: relative;
  right: 6%;
  gap: 0.25em;
`;
