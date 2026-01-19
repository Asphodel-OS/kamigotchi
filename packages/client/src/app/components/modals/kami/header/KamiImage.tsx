import ShareIcon from '@mui/icons-material/Share';
import { Snackbar, SnackbarContent } from '@mui/material';
import { RedditIcon, TelegramIcon, TwitterShareButton, XIcon } from 'react-share';
import styled from 'styled-components';

import { isResting } from 'app/cache/kami';
import { IconButton, TextTooltip } from 'app/components/library';
import { Popover } from 'app/components/library/poppers';
import { Overlay } from 'app/components/library/styles';
import { useSelected, useVisibility } from 'app/stores';
import { clickFx, hoverFx, Shimmer } from 'app/styles/effects';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { DiscordIcon } from 'assets/images/icons/misc';
import { Account, BaseAccount } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { useEffect, useState } from 'react';
import { playClick, playLevelup } from 'utils/sounds';

const LEVEL_UP_STRING = 'Level Up!!';

export const KamiImage = ({
  actions,
  data,
  utils,
}: {
  actions: {
    levelUp: (kami: Kami) => void;
  };
  data: {
    account: Account;
    kami: Kami;
    owner: BaseAccount;
  };
  utils: {
    calcExpRequirement: (level: number) => number;
  };
}) => {
  const { levelUp } = actions;
  const { account, kami, owner } = data;
  const { calcExpRequirement } = utils;
  const setKami = useSelected((s) => s.setKami);
  const { modals } = useVisibility();

  const [isSearching, setIsSearching] = useState(false);
  const [indexInput, setIndexInput] = useState(kami.index);
  const [discordSnackbar, setDiscordSnackbar] = useState(false);

  useEffect(() => {
    if (modals.kami) setIsSearching(false);
  }, [modals.kami]);

  const progress = kami.progress!;
  const expCurr = progress.experience;
  const expLimit = progress ? calcExpRequirement(progress.level) : 40;
  const percentage = Math.floor((expCurr / expLimit) * 1000) / 10;

  const getLevelTooltip = () => {
    if (owner.index != account.index) return 'not ur kami';
    if (expCurr < expLimit) return 'not enough experience';
    if (!isResting(kami)) return 'kami must be resting';
    return LEVEL_UP_STRING;
  };

  /////////////////
  // INTERACTION

  const handleLevelUp = () => {
    levelUp(kami);
    playLevelup();
  };

  const handleIndexChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const quantityStr = event.target.value.replaceAll('[^\\d.]', '');
    const rawQuantity = parseInt(quantityStr || '0');
    const quantity = Math.max(0, rawQuantity);
    setIndexInput(quantity);
  };

  const handleIndexClick = () => {
    setIndexInput(kami.index);
    setIsSearching(true);
    playClick();
  };

  const handleIndexSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setKami(indexInput);
      setIsSearching(false);
      playClick();
    }
  };

  const handleDiscordShare = async () => {
    playClick();
    try {
      await navigator.clipboard.writeText(kami.image);
      setDiscordSnackbar(true);
      setTimeout(() => {
        window.open('https://discord.com/channels/@me', '_blank', 'noopener,noreferrer');
      }, 1000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const canLevel = getLevelTooltip() === LEVEL_UP_STRING;

  /////////////////
  // RENDERING

  // used expCurr >= expLimit and not canLevel to show the level up animation even when not resting
  return (
    <>
      <Container>
        <Image src={kami.image} />
        <Overlay top={0.75} left={0.7}>
          <Grouping>
            <Text size={0.6}>Lvl</Text>
            <Text size={0.9}>{progress ? progress.level : '??'}</Text>
          </Grouping>
        </Overlay>
        <Overlay top={0.75} right={0.7}>
          {!isSearching && (
            <Text size={0.9} onClick={handleIndexClick}>
              {kami.index}
            </Text>
          )}
          {isSearching && (
            <IndexInput
              type={'string'}
              value={indexInput}
              onChange={handleIndexChange}
              onKeyDown={handleIndexSubmit}
            />
          )}
        </Overlay>
        <Overlay top={2.5} right={0.5}>
          <Popover
            content={[
              <TwitterShareButton
                key='twitter'
                url={kami.image}
                title={`Check out my Kami #${kami.index}!`}
                resetButtonStyle={true}
                onClick={playClick}
              >
                <ShareButtonContent>
                  <XIcon size={24} round />
                </ShareButtonContent>
              </TwitterShareButton>,
              <ShareButton
                key='reddit'
                onClick={() => {
                  playClick();
                  window.open(
                    `https://www.reddit.com/submit?url=${encodeURIComponent(kami.image)}&title=${encodeURIComponent(`Check out my Kami #${kami.index}!`)}`,
                    '_blank',
                    'noopener,noreferrer'
                  );
                }}
              >
                <RedditIcon size={24} round />
              </ShareButton>,
              <ShareButton
                key='telegram'
                onClick={() => {
                  playClick();
                  window.open(
                    `https://t.me/share/url?url=${encodeURIComponent(kami.image)}&text=${encodeURIComponent(`Check out my Kami #${kami.index}!`)}`,
                    '_blank',
                    'noopener,noreferrer'
                  );
                }}
              >
                <TelegramIcon size={24} round />
              </ShareButton>,
              <ShareButton key='discord' onClick={handleDiscordShare}>
                <Discord src={DiscordIcon} alt='Discord' />
              </ShareButton>,
            ]}
          >
            <TextTooltip text={['Share']}>
              <IconButton img={ShareIcon} onClick={() => {}} scale={2} />
            </TextTooltip>
          </Popover>
        </Overlay>
        <Overlay bottom={0} fullWidth>
          <TextTooltip text={[`${expCurr}/${expLimit}`]} grow>
            <ExperienceBar percent={percentage}></ExperienceBar>
          </TextTooltip>
          <Percentage>{`${Math.min(percentage, 100)}%`}</Percentage>
          <Overlay bottom={0} right={0}>
            <TextTooltip text={[getLevelTooltip()]}>
              <Button disabled={!canLevel} onClick={() => handleLevelUp()}>
                <Arrow src={ArrowIcons.up} />
                {canLevel && <Shimmer />}
              </Button>
            </TextTooltip>
          </Overlay>
        </Overlay>
      </Container>
      <Snackbar
        open={discordSnackbar}
        onClose={() => setDiscordSnackbar(false)}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <SnackbarContent
          style={{
            backgroundColor: '#fff',
            color: '#333',
            borderRadius: '0.6vw',
            padding: '0.6vw',
          }}
          message='Copying kami link and opening Discord...'
        />
      </Snackbar>
    </>
  );
};

const Container = styled.div`
  position: relative;
  height: 18vw;
  margin: 0.6vw 0 0.6vw 0.6vw;
  overflow: hidden;
`;

const Image = styled.img`
  border: solid black 0.15vw;
  border-radius: 0.6vw;
  height: 100%;
  image-rendering: pixelated;
  user-drag: none;
`;

const Grouping = styled.div`
  position: relative;
  height: 100%;

  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
`;

const Text = styled.div<{ size: number }>`
  color: white;
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size }) => size * 1.5}vw;
  text-shadow: ${({ size }) => `0 0 ${size * 0.5}vw black`};

  &:hover {
    opacity: 0.8;
    cursor: pointer;
  }
`;

const IndexInput = styled.input`
  border: none;
  background-color: #eee;
  width: 4.5vw;
  cursor: text;

  color: black;
  font-size: 0.9vw;
  line-height: 1.35vw;
  text-align: center;
`;

const Percentage = styled.div`
  position: absolute;
  width: 100%;
  padding-top: 0.15vw;
  pointer-events: none;
  font-size: 0.75vw;
  text-align: center;
  text-shadow: 0 0 0.5vw white;
`;

const ExperienceBar = styled.div<{ percent: number }>`
  position: relative;
  border: solid black 0.15vw;
  border-radius: 0 0 0.6vw 0.6vw;
  opacity: 0.6;
  background-color: #bbb;
  height: 1.8vw;
  width: 100%;
  background: ${({ percent }) =>
    `linear-gradient(90deg, #11ee11, 0%, #11ee11, ${percent * 0.95}%, #bbb, ${percent * 1.05}%, #bbb 100%)`};
  display: flex;
  align-items: center;
`;

const Button = styled.div<{
  color?: string;
  disabled?: boolean;
}>`
  border: solid black 0.15vw;
  border-radius: 0 0 0.6vw 0;
  opacity: 0.8;
  height: 1.8vw;
  width: 1.8vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ disabled }) => (disabled ? '#bbb' : '#11ee11')};
  cursor: ${({ disabled }) => (disabled ? 'help' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

  &:hover {
    opacity: 0.9;
    animation: ${() => hoverFx(0.1)} 0.2s;
    transform: scale(1.1);
  }
  &:active {
    animation: ${() => clickFx(0.1)} 0.3s;
  }
  color: black;
  font-size: 0.8vw;
  text-align: center;
  user-select: none;
`;

const Arrow = styled.img`
  width: 1.2vw;
  height: 1.2vw;
`;

const ShareButton = styled.button`
  width: 1.5vw;
  height: 1.5vw;
  padding: 0.1vw;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  background: transparent;
  border-radius: 50%;
  transition: opacity 0.15s ease;
  &:hover {
    opacity: 0.7;
  }
  svg {
    width: 100%;
    height: 100%;
  }
`;

const ShareButtonContent = styled.span`
  width: 1.5vw;
  height: 1.5vw;
  padding: 0.1vw;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: opacity 0.15s ease;
  &:hover {
    opacity: 0.7;
  }
  svg {
    width: 100%;
    height: 100%;
  }
`;

const Discord = styled.img`
  width: 100%;
  height: 100%;
`;
