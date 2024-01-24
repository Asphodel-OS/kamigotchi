import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import styled from "styled-components";

import { triggerIcons } from "assets/images/icons/triggers";
import { playClick } from "utils/sounds";


// TODO: formally define the settings struct at some central location
// TODO: smoother volume slider (atm clunky bc relying directly on localstorage updates)
export const Volume = () => {
  const [settings, setSettings] = useLocalStorage('settings', { volume: { fx: .5, bgm: .5 } });
  const [bgmVolume, setBgmVolume] = useState(settings.volume.bgm);
  const [fxVolume, setFxVolume] = useState(settings.volume.fx);

  useEffect(() => {
    setSettings({ ...settings, volume: { bgm: bgmVolume, fx: fxVolume } });
  }, [bgmVolume, fxVolume]);

  const toggleVolume = (type: string) => {
    let volume = (type === 'fx') ? fxVolume : bgmVolume;
    let setVolume = (type === 'fx') ? setFxVolume : setBgmVolume;
    setVolume((volume === 0) ? .5 : 0);
    playClick();
  };

  const MusicRow = () => {
    const icon = (bgmVolume == 0) ? triggerIcons.soundOff : triggerIcons.soundOn;
    return (
      <Row>
        <Text style={{ flexGrow: 2 }}>Music</Text>
        <RangeInput
          type='range'
          min='0'
          max='1'
          step='0.1'
          value={bgmVolume}
          onChange={(e) => setBgmVolume(e.target.value as unknown as number)} />
        <Icon src={icon} onClick={() => toggleVolume('bgm')} />
      </Row>
    );
  }

  const SoundEffectsRow = () => {
    const icon = (fxVolume == 0) ? triggerIcons.soundOff : triggerIcons.soundOn;
    return (
      <Row>
        <Text style={{ flexGrow: 2 }}>Sounds</Text>
        <RangeInput
          type='range'
          min='0'
          max='1'
          step='0.1'
          value={fxVolume}
          onChange={(e) => setFxVolume(e.target.value as unknown as number)} />
        <Icon src={icon} onClick={() => toggleVolume('fx')} />
      </Row>
    );
  }

  return (
    <Section>
      <Header>Volume</Header>
      <MusicRow />
      <SoundEffectsRow />
    </Section>
  );
}

const Section = styled.div`
  display: flex;
  flex-flow: column nowrap;
  padding: .6vw;
`;

const Header = styled.div`
  font-size: 1vw;
  color: #333;
  text-align: left;
  font-family: Pixel;
  padding-bottom: .5vw;
`;

const Row = styled.div`
  padding-left: .7vw;
  padding-right: .7vw;
  padding-bottom: .3vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const Icon = styled.img`
  width: 3vw;
  height: 3vw;
  margin: 0vw 1vw;
  cursor: pointer;
`;

const Text = styled.p`
  color: #333;
  font-family: Pixel;
  font-size: .8vw;
  text-align: left;
`;

// how df do you style this thing
const RangeInput = styled.input`
  padding: 0;
  cursor: pointer;
`;