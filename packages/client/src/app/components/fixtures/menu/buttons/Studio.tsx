import { MenuIcons } from 'assets/images/icons/menu';
import { IconButton, TextTooltip } from 'app/components/library';
import { useVisibility } from 'app/stores';

export const StudioMenuButton = () => {
  const setModals = useVisibility((s) => s.setModals);
  const isStudioOpen = useVisibility((s) => s.modals.animationStudio);
  
  // Only show in development mode (localhost:3000); SSR-safe
  const isDev =
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost' &&
    window.location.port === '3000';
  
  if (!isDev) return null;

  const handleClick = () => {
    setModals({ animationStudio: !isStudioOpen });
  };

  return (
    <TextTooltip text={[`Animation Studio (Dev Only)`]}>
      <IconButton
        img={MenuIcons.settings}
        onClick={handleClick}
        scale={4.5}
        scaleOrientation='vh'
        radius={0.9}
        cornerAlt
      />
    </TextTooltip>
  );
};
