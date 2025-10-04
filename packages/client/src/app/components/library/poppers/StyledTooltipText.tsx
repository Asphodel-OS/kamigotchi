import { ReactNode } from 'react';
import styled from 'styled-components';

export const StyledTooltipText = ({
  img,
  title,
  subTitleText,
  subTitleContent,
  description,
  leftSideText,
  leftSideContent,
  rightSideText,
  rightSideContent,
}: {
  img: string;
  title: string;
  subTitleText: string;
  subTitleContent: ReactNode;
  description?: string;
  leftSideText: string;
  leftSideContent: ReactNode;
  rightSideText: string;
  rightSideContent: ReactNode;
}) => {
  return (
    <Container>
      <Header>
        <Image src={img} />
        <SubSection>
          <Title>{title}</Title>
          <Subtitle>
            {subTitleText}: {subTitleContent}
          </Subtitle>
        </SubSection>
      </Header>

      <Description>{description}</Description>
      <BottomSection>
        <Section>
          {leftSideText}: <Content>{leftSideContent}</Content>
        </Section>
        <Section>
          {rightSideText}:<Content>{rightSideContent}</Content>
        </Section>
      </BottomSection>
    </Container>
  );
};

const Container = styled.div`
  padding: 0.2vw;
  min-width: 20vw;
`;

const Header = styled.span`
  display: flex;
  align-items: stretch;
  background-color: transparent;
  color: #666;
  border-radius: 0.4vw;
  padding: 0 0.3vw;
`;

const Section = styled.span`
  color: #666;
  background: #f0f0f0;
  border-radius: 0.4vw;
  padding: 0 0.3vw;
  width: 100%;
`;

const SubSection = styled.span`
  display: flex;
  flex-direction: column;
  margin-left: 0.5vw;
  align-items: flex-start;
  text-align: left;
  margin-top: 0.5vw;
`;

const BottomSection = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0.5vw;
  padding: 0.5vw;
`;

const Image = styled.img`
  width: 4.5vw;
  height: 4.5vw;
  padding: 0.3vw;
  border-radius: 0.6vw;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  border: solid black 0.15vw;
`;

const Title = styled.div`
  font-size: 1.2vw;
  font-weight: bold;
`;

const Subtitle = styled.div`
  display: flex;
  gap: 0.3vw;
  align-items: flex-start;
`;

const Description = styled.div`
  margin: 0.5vw 0 0 0;
  font-size: 0.8vw;
  font-style: italic;
  white-space: normal;
`;

const Content = styled.div``;
