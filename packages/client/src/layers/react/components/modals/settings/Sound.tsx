import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import styled from "styled-components";

import mutedSoundImage from 'assets/images/icons/sound_muted_native.png';
import soundImage from 'assets/images/icons/sound_native.png';
import { useSoundSettings } from "layers/react/store/soundSettings";
import { playClick } from "utils/sounds";


export const Sound = () => {
  const [volumeFX, setVolumeFX] = useLocalStorage('volumeFX', .5);
  const [volumeMusic, setVolumeMusic] = useLocalStorage('volumeMusic', .5);

  useEffect(() => {
    useSoundSettings.setState({ volumeFX, volumeMusic });
  }, [volumeFX, volumeMusic]);

  const toggleVolume = (type: string) => {
    let volume = (type === 'fx') ? volumeFX : volumeMusic;
    let setVolume = (type === 'fx') ? setVolumeFX : setVolumeMusic;
    (volume == 0) ? setVolume(0.5) : setVolume(0);
    playClick();
  };

  const VolumeRow = (type: string) => {
    let label = '';
    let volume = 0;
    let setVolume = (v: number) => { };

    if (type === 'fx') {
      label = 'FX';
      volume = volumeFX;
      setVolume = setVolumeFX;
    } else if (type === 'music') {
      label = 'Music';
      volume = volumeMusic;
      setVolume = setVolumeMusic;
    }

    return (
      <Row>
        <Text style={{ flexGrow: 2 }}>{label}</Text>
        <RangeInput
          type='range'
          min='0'
          max='1'
          step='0.1'
          value={volume}
          onChange={(e) => setVolume(e.target.value as unknown as number)}
        />
        <div
          className='window'
          onClick={() => toggleVolume(type)}
          style={{ pointerEvents: 'auto', padding: '0px 6px' }
          }>
          <img src={(volume != 0) ? soundImage : mutedSoundImage} alt='sound_icon' />
        </div>
      </Row>
    );
  }


  return (
    <Section>
      <Header>Sound</Header>
      {VolumeRow('music')}
      {VolumeRow('fx')}
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

const Text = styled.p`
  color: #333;
  font-family: Pixel;
  font-size: .8vw;
  text-align: left;
`;

const RangeInput = styled.input`
  display: block;
  width: '55px',
  height: '15px',
  borderRadius: '10px',
  background: '#d3d3d3',
  outline: 'none',
  opacity: 0.7,
  transition: 'opacity 0.2s',
`;