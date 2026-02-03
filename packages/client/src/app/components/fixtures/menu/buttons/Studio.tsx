import { IconButton, TextTooltip } from 'app/components/library';
import { useModalToggle } from 'app/root/hooks';
import { MenuIcons } from 'assets/images/icons/menu';

export const StudioMenuButton = () => {
  const toggleModal = useModalToggle();

  // Only show in development mode (localhost:3000); SSR-safe
  const isDev =
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost' &&
    window.location.port === '3000';

  if (!isDev) return null;

  return (
    <TextTooltip text={[`Animation Studio (Dev Only)`]}>
      <IconButton
        img={MenuIcons.settings}
        onClick={() => toggleModal('animationStudio')}
        radius={0.4}
        cornerAlt
      />
    </TextTooltip>
  );
};
