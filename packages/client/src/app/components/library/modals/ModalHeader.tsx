import styled from 'styled-components';

// ModalHeader renders a standard modal header with Title and optional icon.
export const ModalHeader = ({
  icon,
  title,
}: {
  title: string;
  icon?: string;
}) => {
  return (
    <Container>
      {icon && <Image src={icon} alt={title} />}
      <Title>{title}</Title>
    </Container>
  );
};

const Container = styled.div`
  padding: 0.6em 1em;
  gap: 0.7em;
  line-height: 1.5em;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-start;
  user-select: none;
`;

const Title = styled.div`
  font-size: 1.2em;
  color: #333;
  text-align: left;
  font-family: Pixel;
`;

const Image = styled.img`
  height: 2em;
  width: auto;
  user-drag: none;
`;
