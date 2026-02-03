import { IconButton, TextTooltip } from 'app/components/library';
import { useIsMobile, useIsPortrait, getPortraitCollidingModals } from 'app/root/hooks';
import { Modals, useVisibility } from 'app/stores';
import { MenuIcons } from 'assets/images/icons/menu';

export const StudioMenuButton = () => {
  const setModals = useVisibility((s) => s.setModals);
  const isStudioOpen = useVisibility((s) => s.modals.animationStudio);
  const isMobile = useIsMobile();
  const isPortrait = useIsPortrait();

  // Only show in development mode (localhost:3000); SSR-safe
  const isDev =
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost' &&
    window.location.port === '3000';

  if (!isDev) return null;

  const handleClick = () => {
    const { modals } = useVisibility.getState();
    let nextModals: Partial<Modals> = { animationStudio: !isStudioOpen };
    if (!isStudioOpen) {
      if (isMobile) {
        const allClosed = Object.fromEntries(Object.keys(modals).map((key) => [key, false]));
        nextModals = { ...allClosed, animationStudio: true };
      } else if (isPortrait) {
        const collidingModals = getPortraitCollidingModals('animationStudio');
        nextModals = { ...nextModals, ...collidingModals };
      }
    }
    setModals(nextModals);
  };

  return (
    <TextTooltip text={[`Animation Studio (Dev Only)`]}>
      <IconButton img={MenuIcons.settings} onClick={handleClick} radius={0.4} cornerAlt />
    </TextTooltip>
  );
};
