// TODO: fix gas wei conversion
const txCostEst = 5 / 10e4;

export const GasConstants = {
  Max: 1000 * txCostEst,
  Full: 100 * txCostEst,
  Half: 50 * txCostEst,
  Quarter: 25 * txCostEst,
  Low: 10 * txCostEst,
  Warning: 5 * txCostEst,
  Empty: 0,
};

export const GasExponent = 18;
