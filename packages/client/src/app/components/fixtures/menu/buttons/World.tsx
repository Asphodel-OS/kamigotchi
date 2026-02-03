import { IconListButton } from 'app/components/library';
import { useModalToggle, useLayers } from 'app/root/hooks';
import { Modals, useSelected } from 'app/stores';
import { queryNodeByIndex } from 'network/shapes/Node';
import { HarvestIcon } from 'assets/images/icons/actions';
import { ChatIcon, MapIcon, World } from 'assets/images/icons/menu';

export const WorldMenuButton = () => {
  const layers = useLayers();
  const setNode = useSelected((s) => s.setNode);
  const roomIndex = useSelected((s) => s.roomIndex);
  const toggleModal = useModalToggle();

  const { world } = layers.network;
  const nodeEntity = queryNodeByIndex(world, roomIndex);

  const toggleMap = () => {
    const hideModals: Partial<Modals> = {
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
    toggleModal('map', hideModals);
  };

  const toggleHarvest = () => {
    const { roomIndex } = useSelected.getState();
    setNode(roomIndex);
    const hideModals: Partial<Modals> = {
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
    toggleModal('node', hideModals);
  };

  const toggleChat = () => {
    const hideModals: Partial<Modals> = {
      help: false,
      inventory: false,
      quests: false,
      settings: false,
      questDialogue: false,
      dialogue: false,
      kami: false,
    };
    toggleModal('chat', hideModals);
  };

  return (
    <IconListButton
      img={World}
      options={[
        { text: 'Map', image: MapIcon, onClick: toggleMap },
        { text: 'Node', image: HarvestIcon, onClick: toggleHarvest, disabled: !nodeEntity },
        { text: 'Chat', image: ChatIcon, onClick: toggleChat },
      ]}
      tooltip={{ text: ['World'] }}
      menuButton={true}
    />
  );
};
