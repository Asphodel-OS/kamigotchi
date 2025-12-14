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
    audioQuality: 'low',
  });
  const [bgmVolume, setBgmVolume] = useState(settings.volume.bgm);
  const [fxVolume, setFxVolume] = useState(settings.volume.fx);
  const [audioQuality, setAudioQuality] = useState<'low' | 'high'>(
    (settings as any).audioQuality || 'low'
  );

  useEffect(() => {
    setSettings({ ...settings, volume: { bgm: bgmVolume, fx: fxVolume }, audioQuality });
    audioManager.setBusVolume('bgm', bgmVolume);
    audioManager.setBusVolume('fx', fxVolume);
  }, [bgmVolume, fxVolume, audioQuality]);

  useEffect(() => {
    audioManager.setQuality(audioQuality);
  }, [audioQuality]);

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
          onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
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
        onChange={(e) => setFxVolume(parseFloat(e.target.value))}
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
      <Section>
        <Title>Audio Quality</Title>
        <Row>
          <Text style={{ flexGrow: 2 }}>Prefer faster downloads</Text>
          <Select
            value={audioQuality}
            onChange={(e) => {
              const q = e.target.value as 'low' | 'high';
              setAudioQuality(q);
            }}
          >
            <option value='low'>Fast (96 kbps)</option>
            <option value='high'>Standard (128 kbps)</option>
          </Select>
        </Row>
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

const Select = styled.select`
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.2);
  color: white;
`;
