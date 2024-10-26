import styled from 'styled-components';

interface Props {
  title: string;
  icon?: string;
  staminaBar?: React.JSX.Element;
}

// ModalHeader renders a standard modal header with Title and optional icon.
export const ModalHeader = (props: Props) => {
  const { icon, title, staminaBar } = props;

  return (
    <Wrapper>
      {icon && <Image src={icon} alt={title} />}
      <Title>{title}</Title>
      {staminaBar}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  padding: 0.6vw 1vw;
  gap: 0.7vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-start;
`;

const Title = styled.div`
  font-size: 1.2vw;
  color: #333;
  text-align: left;
  font-family: Pixel;
`;

const Image = styled.img`
  height: 2vw;
  width: auto;
`;
