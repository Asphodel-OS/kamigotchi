import { Howler } from 'howler';
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
    Howler.volume(bgmVolume);
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

  const SoundEffectsRow = () => {
    const icon = fxVolume == 0 ? TriggerIcons.soundOff : TriggerIcons.soundOn;
    return (
      <Row>
        <Text style={{ flexGrow: 2 }}>Sounds</Text>
        <RangeInput
          type='range'
          min='0'
          max='1'
          step='0.1'
          value={fxVolume}
          onChange={(e) => setFxVolume(e.target.value as unknown as number)}
        />
        <Icon src={icon} onClick={() => toggleVolume('fx')} />
      </Row>
    );
  };

  return (
    <Section>
      <Header>Volume</Header>
      <MusicRow />
      <SoundEffectsRow />
    </Section>
  );
};

const Section = styled.div`
  display: flex;
  flex-flow: column nowrap;
  padding: 0.6em;
`;

const Header = styled.div`
  font-size: 1em;
  color: #333;
  text-align: left;
  font-family: Pixel;
  padding-bottom: 0.5em;
`;

const Row = styled.div`
  padding-left: 0.7em;
  padding-right: 0.7em;
  padding-bottom: 0.3em;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const Icon = styled.img`
  width: 3em;
  height: 3em;
  margin: 0em 1em;
  cursor: pointer;
`;

const Text = styled.p`
  color: #333;
  font-family: Pixel;
  font-size: 0.8em;
  text-align: left;
`;

// how df do you style this thing
const RangeInput = styled.input`
  padding: 0;
  cursor: pointer;
`;
