import { BigNumberish } from 'ethers';

export const gachaAPI = (systems: any) => {
  /////////////////
  // KAMI

  // @dev mint a pet with a gacha ticket
  // @param amount  number of pets to mint
  function mintPet(amount: number) {
    // RPC does not simulate gas properly, hardcode needed
    const gas = 4e6 + amount * 3e6; // ~ 4m base + 3m per pet
    return systems['system.kami.gacha.mint'].executeTyped(amount, { gasLimit: gas });
  }

  // @dev reveal a minted pet
  // @param commitIDs array of commitIDs
  function revealPet(commitIDs: BigNumberish[]) {
    return systems['system.kami.gacha.reveal'].reveal(commitIDs);
  }

  // @dev reroll a pet
  // @param kamiID  kamiID
  function rerollPet(kamiIDs: BigNumberish[]) {
    return systems['system.kami.gacha.reroll'].reroll(kamiIDs);
  }

  /////////////////
  // TICKETS

  function buyTicketsPublic(amount: number) {
    return systems['system.buy.gacha.ticket'].buyPublic(amount);
  }

  function buyTicketsWL() {
    return systems['system.buy.gacha.ticket'].buyWL();
  }

  return {
    pet: {
      mint: mintPet,
      reveal: revealPet,
      reroll: rerollPet,
    },
    tickets: {
      buy: {
        public: buyTicketsPublic,
        whitelist: buyTicketsWL,
      },
    },
  };
};
