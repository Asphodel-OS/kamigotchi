import { audioManager } from 'audio/AudioManager';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { TriggerIcons } from 'assets/images/icons/triggers';
import { playClick } from 'utils/sounds';

// TODO: formally define the settings struct at some central roomIndex
// TODO: smoother volume slider (atm clunky bc relying directly on localstorage updates)
export const Volume = () => {
  const [settings, setSettings] = useLocalStorage('settings', {
    volume: { fx: 0.5, bgm: 0.5 },
  });
  const [bgmVolume, setBgmVolume] = useState(settings.volume.bgm);
  const [fxVolume, setFxVolume] = useState(settings.volume.fx);

  useEffect(() => {
    setSettings({ ...settings, volume: { bgm: bgmVolume, fx: fxVolume } });
    audioManager.setBusVolume('bgm', bgmVolume);
    audioManager.setBusVolume('fx', fxVolume);
  }, [bgmVolume, fxVolume]);

  const toggleVolume = (type: string) => {
    let volume = type === 'fx' ? fxVolume : bgmVolume;
    let setVolume = type === 'fx' ? setFxVolume : setBgmVolume;
    setVolume(volume === 0 ? 0.5 : 0);
    playClick();
  };

  const MusicRow = () => {
    const icon = bgmVolume == 0 ? TriggerIcons.soundOff : TriggerIcons.soundOn;
    return (
      <Row>
        <Text style={{ flexGrow: 2 }}>Music</Text>
        <RangeInput
          type='range'
          min='0'
          max='1'
          step='0.1'
          value={bgmVolume}
          onChange={(e) => setBgmVolume(e.target.value as unknown as number)}
        />
        <Icon src={icon} onClick={() => toggleVolume('bgm')} />
      </Row>
    );
  };

  const SoundEffectsRow = () => (
    <Row>
      <Text style={{ flexGrow: 2 }}>Sound FX</Text>
      <RangeInput
        type='range'
        min='0'
        max='1'
        step='0.1'
        value={fxVolume}
        onChange={(e) => setFxVolume(e.target.value as unknown as number)}
      />
      <Icon
        src={fxVolume == 0 ? TriggerIcons.soundOff : TriggerIcons.soundOn}
        onClick={() => toggleVolume('fx')}
      />
    </Row>
  );

  return (
    <Container>
      <Section>
        <Title>Volume</Title>
        {MusicRow()}
        {SoundEffectsRow()}
      </Section>
    </Container>
  );
};

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 1.4rem;
  margin-bottom: 4px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Text = styled.div`
  font-size: 1rem;
`;

const RangeInput = styled.input`
  width: 180px;
`;

const Icon = styled.img`
  width: 20px;
  height: 20px;
  cursor: pointer;
`;
