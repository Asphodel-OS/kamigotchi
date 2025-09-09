import { IconListButton } from 'app/components/library';
import { ExternalIcon, SudoIcon } from 'assets/images/icons/menu';
import * as placeholder from 'assets/images/icons/placeholder.png';

const KAMI_ADDR = '0x5d4376b62fa8ac16dfabe6a9861e11c33a48c677';

export const SudoMenuButton = () => {
  const openSudoLink = () => {
    window.open(`https://sudoswap.xyz/#/browse/yominet/buy/${KAMI_ADDR}`, '_blank', 'noopener');
  };
  const openKamibotsLink = () => {
    window.open(`https://www.kamibots.xyz`, '_blank', 'noopener');
  };

  return (
    <IconListButton
      img={ExternalIcon}
      options={[
        { text: 'Sudoswap', image: SudoIcon, onClick: openSudoLink },
        { text: 'KamiBots', image: placeholder.default, onClick: openKamibotsLink },
      ]}
      scale={4.5}
      scaleOrientation='vh'
      radius={0.9}
      tooltipProps={{ text: ['External Apps'] }}
    />
  );
};
