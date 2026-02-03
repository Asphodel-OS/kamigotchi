import { IconListButton } from 'app/components/library';
import { useIsMobile, useIsPortrait, getPortraitCollidingModals, useLayers } from 'app/root/hooks';
import { Modals, useSelected, useVisibility } from 'app/stores';
import { queryNodeByIndex } from 'network/shapes/Node';
import { HarvestIcon } from 'assets/images/icons/actions';
import { ChatIcon, MapIcon, World } from 'assets/images/icons/menu';

export const WorldMenuButton = () => {
  const layers = useLayers();
  const setModals = useVisibility((s) => s.setModals);
  const setNode = useSelected((s) => s.setNode);
  const roomIndex = useSelected((s) => s.roomIndex);
  const isMobile = useIsMobile();
  const isPortrait = useIsPortrait();

  const { world } = layers.network;
  const nodeEntity = queryNodeByIndex(world, roomIndex);

  const manageMobile = (targetModal: keyof Modals, hideModals: Partial<Modals>) => {
    const { modals } = useVisibility.getState();
    const isModalOpen = modals[targetModal];
    let nextModals: Partial<Modals> = { [targetModal]: !isModalOpen };
    if (!isModalOpen) {
      if (isMobile) {
        const allClosed = Object.fromEntries(Object.keys(modals).map((key) => [key, false]));
        nextModals = { ...allClosed, [targetModal]: true };
      } else if (isPortrait) {
        const collidingModals = getPortraitCollidingModals(targetModal);
        nextModals = { ...nextModals, ...collidingModals };
      } else {
        nextModals = { ...nextModals, ...hideModals };
      }
    }
    setModals(nextModals);
  };

  const toggleMap = (targetModal: keyof Modals) => {
    const modalsToHide: Partial<Modals> = {
      account: false,
      bridgeERC20: false,
      bridgeERC721: false,
      dialogue: false,
      emaBoard: false,
      goal: false,
      kami: false,
      leaderboard: false,
      merchant: false,
      party: false,
      trading: false,
    };
    manageMobile(targetModal, modalsToHide);
  };

  const toggleHarvest = (targetModal: keyof Modals) => {
    const { roomIndex } = useSelected.getState();
    setNode(roomIndex);
    const modalsToHide: Partial<Modals> = {
      goal: false,
      crafting: false,
      bridgeERC20: false,
      bridgeERC721: false,
      dialogue: false,
      kami: false,
      gacha: false,
      emaBoard: false,
      presale: false,
      tokenPortal: false,
      trading: false,
    };
    manageMobile(targetModal, modalsToHide);
  };

  const toggleChat = (targetModal: keyof Modals) => {
    const modalsToHide: Partial<Modals> = {
      help: false,
      inventory: false,
      quests: false,
      settings: false,
      questDialogue: false,
      dialogue: false,
      kami: false,
    };
    manageMobile(targetModal, modalsToHide);
  };

  return (
    <IconListButton
      img={World}
      options={[
        { text: 'Map', image: MapIcon, onClick: () => toggleMap('map') },
        { text: 'Node', image: HarvestIcon, onClick: () => toggleHarvest('node'), disabled: !nodeEntity },
        { text: 'Chat', image: ChatIcon, onClick: () => toggleChat('chat') },
      ]}
      tooltip={{ text: ['World'] }}
      menuButton={true}
    />
  );
};
