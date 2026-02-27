import { IconListButton } from 'app/components/library';
import { ExternalIcon, Whispo } from 'assets/images/icons/menu';

export const SudoMenuButton = () => {
  const openKamibotsLink = () => {
    window.open(`https://www.kamibots.xyz`, '_blank', 'noopener');
  };

  return (
    <IconListButton
      img={ExternalIcon}
      options={[
        { text: 'KamiBots', image: Whispo, onClick: openKamibotsLink },
      ]}
      scale={4.5}
      scaleOrientation='vh'
      radius={0.9}
      tooltip={{ text: ['External Apps'] }}
    />
  );
};
