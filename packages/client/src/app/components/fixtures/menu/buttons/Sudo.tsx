import { IconListButton } from 'app/components/library';
import { ExternalIcon, Whispo } from 'assets/images/icons/menu';
import KamiStatsIcon from 'assets/images/icons/menu/kamistats.png';
import KamiWikiIcon from 'assets/images/icons/menu/kamiwiki.png';

export const SudoMenuButton = () => {
  const openKamibotsLink = () => {
    window.open(`https://www.kamibots.xyz`, '_blank', 'noopener');
  };

  const openKamiWikiLink = () => {
    window.open(`https://kamiwiki.xyz/`, '_blank', 'noopener');
  };

  const openKamiStatsLink = () => {
    window.open(`https://kamistats.com/`, '_blank', 'noopener');
  };

  return (
    <IconListButton
      img={ExternalIcon}
      options={[
        { text: 'KamiBots', image: Whispo, onClick: openKamibotsLink },
        { text: 'KamiWiki', image: KamiWikiIcon, onClick: openKamiWikiLink },
        { text: 'KamiStats', image: KamiStatsIcon, onClick: openKamiStatsLink },
      ]}
      scale={4.5}
      scaleOrientation='vh'
      radius={0.9}
      tooltip={{ text: ['External Apps'] }}
    />
  );
};
