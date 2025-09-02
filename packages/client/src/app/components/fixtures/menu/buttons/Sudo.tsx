import { IconButton, TextTooltip } from 'app/components/library';
import { MenuIcons } from 'assets/images/icons/menu';

const KAMI_ADDR = '0x5d4376b62fa8ac16dfabe6a9861e11c33a48c677';

export const SudoMenuButton = () => {
  const openSudoLink = () => {
    window.open(`https://sudoswap.xyz/#/browse/yominet/buy/${KAMI_ADDR}`, '_blank');
  };

  return (
    <TextTooltip text={['View Kami listings on SudoSwap']}>
      <IconButton
        img={MenuIcons.sudo}
        onClick={openSudoLink}
        scale={4.5}
        scaleOrientation='em'
        radius={0.9}
        cornerAlt
      />
    </TextTooltip>
  );
};
