// NPC headshots for dialogue speaker cards, keyed by lowercase npcs.csv name

import artieZbirak from './artie_zbirak.png';
import dimiA from './dimi_a.png';
import dimiB from './dimi_b.png';
import dolores from './dolores.png';
import menuHandheld from './menu_handheld.png';
import menuHuman from './menu_human.png';
import mina from './mina.png';
import nurseWhy from './nurse_why.png';
import rob from './rob.png';
import vendingMachine from './vending_machine.png';
import zevana from './zevana.png';

export const NpcPfps: Record<string, string> = {
  'artie zbirak': artieZbirak,
  dimidiatus: dimiB, // speaks through the frowning mask by default
  'dimidiatus a': dimiA,
  'dimidiatus b': dimiB,
  dolores: dolores,
  menu: menuHandheld, // menu speaks through the handheld
  'menu human': menuHuman,
  mina: mina,
  'nurse why': nurseWhy,
  rob: rob,
  'vending machine': vendingMachine,
  zevana: zevana,
};
