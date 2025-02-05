import styled from 'styled-components';

interface Props {
  balance: string;
  title: string;
  icon?: string;
  onClick?: () => void;
}

export const SideBalance = (props: Props) => {
  return (
    <Container>
      <Row>
        {/* {props.icon && <Icon src={props.icon} />} */}
        {/* <NumberText>{props.balance}</NumberText> */}
        <NumberText>{props.balance} rerolls per kami</NumberText>
      </Row>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  padding: 0vh 1vw;

  text-decoration: inherit;
`;

const Icon = styled.img`
  height: 2.8vh;
  padding-right: 0.5vw;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  text-decoration: inherit;
`;

const NumberText = styled.div`
  font-family: Pixel;
  font-size: 1.8vh;
  color: #333;

  text-decoration: inherit;
`;
