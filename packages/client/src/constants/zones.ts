interface Zone {
  name: string;
  width: number;
  height: number;
  offset: {
    x: number;
    y: number;
  };
}
const zone0: Zone = {
  name: 'zone0',
  width: 9,
  height: 13,
  offset: {
    x: 0,
    y: 0,
  },
};

const zone1: Zone = {
  name: 'zone1',
  width: 9,
  height: 13,
  offset: {
    x: 0,
    y: 1,
  },
};

const zone2 = undefined;

const zone3: Zone = {
  name: 'zone1',
  width: 10,
  height: 13,
  offset: {
    x: 0,
    y: -1,
  },
};

export const Zones: (Zone | undefined)[] = [zone0, zone1, zone2, zone3];
