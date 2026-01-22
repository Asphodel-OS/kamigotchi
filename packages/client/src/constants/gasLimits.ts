export type GasConfig = {
  base: bigint;
  perItem?: bigint;
  max?: bigint;
};

export const GAS_LIMITS: Record<string, GasConfig> = {
  // current gaslimit overrides are set in separate client api files....
  // TODO: would be better to have them centralized?
  /*                                                                                                                                              
    'system.harvest.liquidate': {                                                                                                                        
      base: 7_500_000n,                                                                                                                                  
    },                                                                                                                                                   
    'system.account.move': {                                                                                                                             
      base: 1_200_000n,                                                                                                                                  
    }
    */
};
