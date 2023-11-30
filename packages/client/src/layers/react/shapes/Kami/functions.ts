import { Kami } from './Kami';


////////////////
// STATE CHECKS

// naive check right now, needs to be updated with murder check as well
export const isDead = (kami: Kami): boolean => {
  return kami.state === 'DEAD';
};

// check whether the kami is harvesting
export const isHarvesting = (kami: Kami): boolean =>
  kami.state === 'HARVESTING';

// check whether the kami is resting
export const isResting = (kami: Kami): boolean => {
  return kami.state === 'RESTING';
};

// check whether the kami is revealed
export const isUnrevealed = (kami: Kami): boolean => {
  return kami.state === 'UNREVEALED';
};

// check whether the kami is captured by slave traders
export const isOffWorld = (kami: Kami): boolean => {
  return kami.state === '721_EXTERNAL';
};

// interpret the location of the kami based on the kami's state (using Account and Production Node)
// return 0 if the location cannot be determined from information provided
export const getLocation = (kami: Kami): number => {
  let location = 0;
  if (!isHarvesting(kami) && kami.account) location = kami.account.location;
  else if (kami.production && kami.production.node) {
    location = kami.production.node.location;
  }
  return location;
};


////////////////
// TIME CALCS

// calculate the time a kami has spent idle (in seconds)
export const calcRestTime = (kami: Kami): number => {
  return Date.now() / 1000 - kami.lastUpdated;
};

// calculate the time a production has been active since its last update
export const calcHarvestTime = (kami: Kami): number => {
  let productionTime = 0;
  if (isHarvesting(kami) && kami.production) {
    productionTime = Date.now() / 1000 - kami.production.startTime;
  }
  return productionTime;
}

// determine whether the kami is still on cooldown
export const onCooldown = (kami: Kami): boolean => {
  return kami.cooldown > calcRestTime(kami);
}


////////////////
// HEALTH CALCS

// calculate health based on the drain against last confirmed health
export const calcHealth = (kami: Kami): number => {
  let duration = 0;
  if (isHarvesting(kami)) duration = calcHarvestTime(kami);
  else if (isResting(kami)) duration = calcRestTime(kami);

  const totalHealth = kami.stats.health + kami.bonusStats.health;
  let health = 1 * kami.health;
  health += kami.healthRate * duration;
  health = Math.min(Math.max(health, 0), totalHealth);
  return health;
};

// check whether the kami is full
export const isFull = (kami: Kami): boolean => {
  const totalHealth = kami.stats.health + kami.bonusStats.health;
  return Math.round(calcHealth(kami)) >= totalHealth;
};


// calculate the expected output from a pet production based on start time
export const calcOutput = (kami: Kami): number => {
  let output = 0;
  if (isHarvesting(kami) && kami.production) {
    output = kami.production.balance;
    let duration = calcHarvestTime(kami);
    output += Math.floor(duration * kami.production?.rate);
  }
  return Math.max(output, 0);
};