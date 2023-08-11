import React from 'react';
import styled from 'styled-components';

interface ExperienceBarProps {
  level: number;
  current: number;
  total: number;
}

export const ExperienceBar: React.FC<ExperienceBarProps> = ({ level, current, total }) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <Wrapper>
      <Level>{`Lvl ${level}`}</Level>
      <BarContainer>
        <FilledBar percentage={percentage} />
        <Percentage>{`${percentage}%`}</Percentage>
      </BarContainer>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: left;
  font-family: Pixel;
  margin: 0px 0px 17px 10px;
`;

const BarContainer = styled.div`
  border: 1px solid black;
  background-color: #bbb;
  border-radius: 10px;
  height: 20px;
  min-width: 200px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: left;
`;

const FilledBar = styled.div<{ percentage: number }>`
  background-color: #11ee11;
  border-radius: 10px;
  height: 100%;
  width: ${props => props.percentage}%;
`;

const Percentage = styled.p`
  color: black;
  position: absolute;
  padding-left: 90px;
  font-family: Pixel;
  font-size: 12px;
`;

const Level = styled.p`
  color: black;
  font-family: Pixel;
  padding-right: 10px;
`;