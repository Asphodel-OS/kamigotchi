export const npcsAPI = (systems: any) => {
  /////////////////
  // LISTINGS

  /**
   * @dev allows a character to buy an item through a merchant listing entity
   *
   * @param merchantIndex entity ID of merchant
   * @param itemIndices array of item indices
   * @param amt amount to buy
   */
  const buyFromListing = (merchantIndex: number, itemIndices: number[], amts: number[]) => {
    return systems['system.listing.buy'].executeTyped(merchantIndex, itemIndices, amts);
  };

  /**
   * @dev allows a character to sell an item through a merchant listing entity
   *
   * @param merchantIndex entity ID of merchant
   * @param itemIndices array of item indices
   * @param amt amount to sell
   */
  const sellToListing = (merchantIndex: number, itemIndices: number[], amts: number[]) => {
    return systems['system.listing.sell'].executeTyped(merchantIndex, itemIndices, amts);
  };

  /////////////////
  // RELATIONSHIPS

  /**
   * @dev advance a relationship
   * @param npcIndex index of the NPC
   * @param stateIndex index of the state of the relationship
   */
  const advanceRelationship = (npcIndex: number, stateIndex: number) => {
    return systems['system.relationship.advance'].executeTyped(npcIndex, stateIndex);
  };

  return {
    listing: {
      buy: buyFromListing,
      sell: sellToListing,
    },
    relationship: {
      advance: advanceRelationship,
    },
  };
};
