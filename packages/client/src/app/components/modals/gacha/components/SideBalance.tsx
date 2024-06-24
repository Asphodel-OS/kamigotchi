import styled from 'styled-components';

interface Props {
  balance: string;
  title: string;
  icon?: string;
  onClick?: () => void;
}

export const SideBalance = (props: Props) => {
  const Display = (
    <Container>
      <Row>
        {props.icon && <Icon src={props.icon} />}
        <NumberText>{props.balance}</NumberText>
      </Row>
      <TitleText>{props.title}</TitleText>
    </Container>
  );

  if (props.onClick) return <ClickableWrapper onClick={props.onClick}>{Display}</ClickableWrapper>;
  else return Display;
};

const ClickableWrapper = styled.div`
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

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

const TitleText = styled.div`
  font-family: Pixel;
  font-size: 1.2vh;
  text-align: left;
  padding: 0.5vh 0.2vw 0;
  color: #666;

  text-decoration: inherit;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  text-decoration: inherit;
`;

const NumberText = styled.div`
  font-family: Pixel;
  font-size: 2.2vh;
  color: #333;

  text-decoration: inherit;
`;
