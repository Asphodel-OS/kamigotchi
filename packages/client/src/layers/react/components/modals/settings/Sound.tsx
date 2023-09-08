import { dataStore } from "layers/react/store/createStore";
import styled from "styled-components";
import mutedSoundImage from 'src/assets/images/icons/sound_muted_native.png';
import soundImage from 'src/assets/images/icons/sound_native.png';


interface Props { }

export const Sound = (props: Props) => {
  const { sound: { volume }, setSoundState } = dataStore();
  const muted = volume == 0;

  const setVolume = (e: any) => {
    const soundVolume = e.target.value as number;
    setSoundState({ volume: soundVolume });
  };

  const toggleSound = () => {
    muted ? setSoundState({ volume: 0.5 }) : setSoundState({ volume: 0 });
  };

  return (
    <Section>
      <Header>Sound</Header>
      <Row>
        <Text style={{ flexGrow: 2 }}>Volume</Text>
        <RangeInput
          type='range'
          min='0'
          max='1'
          step='0.1'
          value={volume}
          onChange={setVolume}
        />
        <div className='window' onClick={toggleSound} style={{ pointerEvents: 'auto', padding: '0px 6px' }}>
          <img src={!muted ? soundImage : mutedSoundImage} alt='sound_icon' />
        </div>
      </Row>
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
`;

const Row = styled.div`
  padding: .7vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const Text = styled.p`
  color: #333;
  font-family: Pixel;
  font-size: .6vw;
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