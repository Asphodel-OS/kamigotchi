import { bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight } from 'assets/images/rooms/3_gate';
import { arrival } from 'assets/sound/ost';
import { Room } from './types';
/*
const NEWBIE_VENDOR_MAX_ACCOUNT_AGE_SECONDS = 24 * 60 * 60;

const onClickZevanaDialogue = () => {
  const network = (window as any).network;
  const { world, components } = network;
  const accountEntity = queryAccountFromEmbedded(network);
  const account = getAccountFromEmbedded(network);
  const hasAnyKamis = queryAccountKamis(world, components, accountEntity).length > 0;
  const now = Math.floor(Date.now() / 1000);
  const isNewbie = now - account.time.creation <= NEWBIE_VENDOR_MAX_ACCOUNT_AGE_SECONDS;
  //const dialogueIndex = !hasAnyKamis && isNewbie ? alternativeindex : 30001;
  const dialogueIndex = 30001;
  triggerDialogueModal(dialogueIndex);
};*/

export const room03: Room = {
  index: 3,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'arrival',
    path: arrival,
  },
  objects: [
    // {
    //   name: 'torii gate',
    //   coordinates: { x1: 48, y1: 29, x2: 123, y2: 85 },
    //   onClick: () => triggerGoalModal([6]),
    // },
    {
      name: 'Zevana',
      coordinates: { x1: 10, y1: 30, x2: 80, y2: 132 },
      dialogue: 30001,
      // onClick: onClickZevanaDialogue,
    },
  ],
};
