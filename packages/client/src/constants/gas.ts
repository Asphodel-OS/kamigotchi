// TODO: fix gas wei conversion
const txCostEst = 1 / 10e4;

export const GasConstants = {
  Max: 1500 * txCostEst,
  Full: 1000 * txCostEst,
  Half: 500 * txCostEst,
  Quarter: 250 * txCostEst,
  Low: 100 * txCostEst,
  Warning: 10 * txCostEst,
  Empty: 0,
};

export const GasExponent = 18;
