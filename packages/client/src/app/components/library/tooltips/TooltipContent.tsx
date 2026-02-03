import { ReactNode } from 'react';
import styled from 'styled-components';

export const TooltipContent = ({
  img,
  title,
  description,
  subtitle,
  left,
  right,
  borderColor,
  titleColor,
}: {
  img: string;
  title: string;
  description?: string;
  subtitle: {
    text: string;
    content: ReactNode;
  };
  left?: {
    text: string;
    content: ReactNode;
    align?: 'center' | 'flex-start' | 'flex-end';
  };
  right?: {
    text: string;
    content: ReactNode;
    align?: 'center' | 'flex-start' | 'flex-end';
  };
  borderColor?: string;
  titleColor?: string;
}) => {
  return (
    <Container $borderColor={borderColor}>
      <Header>
        <Image src={img} />
        <SubSection>
          <Title $color={titleColor}>{title}</Title>
          <Subtitle>
            {subtitle.text}: {subtitle.content}
          </Subtitle>
        </SubSection>
      </Header>
      {description && <Description>{description}</Description>}
      <BottomSection>
        {left && (
          <Section align={left.align ?? 'center'}>
            {left.text}: <Content>{left.content}</Content>
          </Section>
        )}
        {right && (
          <Section align={right.align ?? 'center'}>
            {right.text}: <Content>{right.content}</Content>
          </Section>
        )}
      </BottomSection>
    </Container>
  );
};

const Container = styled.div<{ $borderColor?: string }>`
  padding: 0.2em;
  ${({ $borderColor }) =>
    $borderColor &&
    `
    outline: 0.2em solid ${$borderColor};
    border-radius: 0.4em;
  `}
`;

const Header = styled.span`
  display: flex;
  align-items: stretch;
  background-color: transparent;
  color: #666;
  border-radius: 0.4em;
  padding: 0 0.3em;
`;

const Section = styled.span<{ align?: 'center' | 'flex-start' | 'flex-end' }>`
  color: #666;
  background: #f0f0f0;
  border-radius: 0.4em;
  padding: 0 0.3em;
  width: 100%;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: ${({ align }) => align ?? 'center'};
`;

const SubSection = styled.span`
  display: flex;
  flex-direction: column;
  margin-left: 0.5em;
  align-items: flex-start;
  text-align: left;
  margin-top: 0.5em;
`;

const BottomSection = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0.5em;
  padding: 0.5em;
`;

const Image = styled.img`
  width: 4.5em;
  height: 4.5em;
  padding: 0.3em;
  border-radius: 0.6em;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  border: solid black 0.15em;
`;

const Title = styled.div<{ $color?: string }>`
  font-size: 1.2em;
  font-weight: bold;
  ${({ $color }) => $color && `color: ${$color};`}
`;

const Subtitle = styled.div`
  display: flex;
  gap: 0.3em;
  align-items: flex-start;
`;

const Description = styled.div`
  margin: 0.5em 0 0 0;

  font-style: italic;
  white-space: normal;
`;

const Content = styled.div`
  white-space: pre-line;
`;
