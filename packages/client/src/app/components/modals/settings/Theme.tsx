import styled from 'styled-components';

import { useTheme } from 'app/root/hooks';
import { ClockIcons } from 'assets/images/icons/clock';
import { playClick } from 'utils/sounds';

export const Theme = () => {
  const { mode, toggleTheme } = useTheme();

  const handleToggle = () => {
    playClick();
    toggleTheme();
  };

  const icon = mode === 'dark' ? ClockIcons.night : ClockIcons.day;

  return (
    <Section>
      <Header>Appearance</Header>
      <Row>
        <Text>Dark Mode</Text>
        <ToggleContainer onClick={handleToggle}>
          <ToggleTrack isDark={mode === 'dark'}>
            <ToggleThumb isDark={mode === 'dark'} />
          </ToggleTrack>
          <Icon src={icon} />
        </ToggleContainer>
      </Row>
    </Section>
  );
};

const Section = styled.div`
  display: flex;
  flex-flow: column nowrap;
  padding: 0.6vw;
`;

const Header = styled.div`
  font-size: 1vw;
  color: var(--text-secondary, #333);
  text-align: left;
  font-family: Pixel;
  padding-bottom: 0.5vw;
`;

const Row = styled.div`
  padding-left: 0.7vw;
  padding-right: 0.7vw;
  padding-bottom: 0.3vw;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const Text = styled.p`
  color: var(--text-secondary, #333);
  font-family: Pixel;
  font-size: 0.8vw;
  text-align: left;
`;

const ToggleContainer = styled.div`
  cursor: pointer;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.5vw;
`;

const ToggleTrack = styled.div<{ isDark: boolean }>`
  width: 3vw;
  height: 1.5vw;
  border-radius: 0.75vw;
  background-color: ${({ isDark }) => (isDark ? 'var(--bg-tertiary, #0f3460)' : 'var(--disabled-bg, #ccc)')};
  position: relative;
  transition: background-color 0.2s ease;
  border: solid var(--border-primary, black) 0.1vw;
`;

const ToggleThumb = styled.div<{ isDark: boolean }>`
  width: 1.2vw;
  height: 1.2vw;
  border-radius: 50%;
  background-color: ${({ isDark }) => (isDark ? 'var(--text-primary, #e8e8e8)' : 'var(--bg-primary, #fff)')};
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: ${({ isDark }) => (isDark ? 'calc(100% - 1.35vw)' : '0.15vw')};
  transition: left 0.2s ease, background-color 0.2s ease;
  border: solid var(--border-primary, black) 0.1vw;
`;

const Icon = styled.img`
  width: 2vw;
  height: 2vw;
`;
