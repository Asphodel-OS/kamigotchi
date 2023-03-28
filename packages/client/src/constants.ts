interface RoomInfo {
  room: number;
}
type GridRooms = { [key: string]: RoomInfo };

export const roomExits = [
  {},
  { up: 2 },
  { up: 3, down: 1, left: 13 },
  { up: 4, down: 2 },
  { up: 5, down: 3, left: 12 },
  { up: 6, down: 4, left: 9 },
  { up: 7, down: 5 },
  { down: 6, left: 8, right: 14 },
  { right: 7 },
  { up: 11, down: 10, right: 5 },
  { up: 9 },
  { down: 9 },
  { right: 4 },
  { right: 2 },
  { left: 7 },
];

export const gridRooms: GridRooms = {
  '1': { room: 14 },
  '2': { room: 13 },
  '7': { room: 12 },
  '6': { room: 11 },
  '3': { room: 10 },
  '13': { room: 9 },
  '14': { room: 8 },
  '15': { room: 7 },
  '26': { room: 6 },
  '27': { room: 5 },
  '37': { room: 4 },
  '38': { room: 3 },
  '39': { room: 2 },
  '40': { room: 1 },
};

export const describeCharacther = {
  bodyType: [
    'Bee',
    'Butterfly',
    'Cube',
    'Default',
    'Drip',
    'Bulb',
    'Octahedron',
    'Eldritch',
    'Orb',
    'Tube',
    'Ghost',
    'Orb',
  ],
  colors: ['Canto Green'],
  handType: [
    'Orbs',
    'Eyeballs',
    'Mantis',
    'Paws',
    'Plugs',
    'Scorpion',
    'Tentacles',
    'Claws',
  ],
  face: ['^-^', 'c_c', ':3', '._.', 'ಠ_ಠ', 'Dotted', 'Squiggle', 'v_v', 'x_x'],
};
