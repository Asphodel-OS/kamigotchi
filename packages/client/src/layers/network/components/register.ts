import {
  defineBoolComponent,
  defineNumberComponent,
  defineStringComponent,
} from "@latticexyz/std-client";

import {
  defineLoadingStateComponent,
  defineNumberArrayComponent,
  defineStringArrayComponent,
} from "./definitions";

// define functions for registration
export function createComponents(world: any) {
  return {
    // Archetypes
    IsAccount: defineBoolComponent(world, { id: "IsAccount", metadata: { contractId: "component.Is.Account" } }),
    IsInventory: defineBoolComponent(world, { id: "IsInventory", metadata: { contractId: "component.Is.Inventory" } }),
    IsListing: defineBoolComponent(world, { id: "IsListing", metadata: { contractId: "component.Is.Listing" } }),
    IsMerchant: defineBoolComponent(world, { id: "IsMerchant", metadata: { contractId: "component.Is.Merchant" } }),
    IsMod: defineBoolComponent(world, { id: "IsMod", metadata: { contractId: "component.Is.Mod" } }),
    IsNode: defineBoolComponent(world, { id: "IsNode", metadata: { contractId: "component.Is.Node" } }),
    IsPet: defineBoolComponent(world, { id: "IsPet", metadata: { contractId: "component.Is.Pet" } }),
    IsProduction: defineBoolComponent(world, { id: "IsProduction", metadata: { contractId: "component.Is.Production" } }),
    IsRegister: defineBoolComponent(world, { id: "IsRegister", metadata: { contractId: "component.Is.Register" } }),
    IsRegistryEntry: defineBoolComponent(world, { id: "IsRegistryEntry", metadata: { contractId: "component.Is.RegistryEntry" } }),
    IsRequest: defineBoolComponent(world, { id: "IsRequest", metadata: { contractId: "component.Is.Request" } }),
    IsRoom: defineBoolComponent(world, { id: "IsRoom", metadata: { contractId: "component.Is.Room" } }),
    IsTrade: defineBoolComponent(world, { id: "IsTrade", metadata: { contractId: "component.Is.Trade" } }),

    // IDs
    AccountID: defineStringComponent(world, { id: "AccountID", metadata: { contractId: "component.Id.Account" } }),
    DelegateeID: defineStringComponent(world, { id: "DelegateeID", metadata: { contractId: "component.Id.Delegatee" } }),
    DelegatorID: defineStringComponent(world, { id: "DelegatorID", metadata: { contractId: "component.Id.Delegator" } }),
    HolderID: defineStringComponent(world, { id: "HolderID", metadata: { contractId: "component.Id.Holder" } }),
    MerchantID: defineStringComponent(world, { id: "MerchantID", metadata: { contractId: "component.Id.Merchant" } }),
    NodeID: defineStringComponent(world, { id: "NodeID", metadata: { contractId: "component.Id.Node" } }),
    OwnerID: defineStringComponent(world, { id: "OwnerID", metadata: { contractId: "component.Id.Owner" } }),
    RequesteeID: defineStringComponent(world, { id: "RequesteeID", metadata: { contractId: "component.Id.Requestee" } }),
    RequesterID: defineStringComponent(world, { id: "RequesterID", metadata: { contractId: "component.Id.Requester" } }),
    PetID: defineStringComponent(world, { id: "PetID", metadata: { contractId: "component.Id.Pet" } }),

    // Indices
    ItemIndex: defineNumberComponent(world, { id: "ItemIndex", metadata: { contractId: "component.Index.Item" } }),
    ModifierIndex: defineNumberComponent(world, { id: "ModifierIndex", metadata: { contractId: "component.Index.Mod" } }),
    PetIndex: defineStringComponent(world, { id: "PetIndex", metadata: { contractId: "component.Index.Pet" } }),

    // Values
    Balance: defineNumberComponent(world, { id: "Balance", metadata: { contractId: "component.Balance" } }),
    BlockLast: defineNumberComponent(world, { id: "BlockLast", metadata: { contractId: "component.BlockLast" } }),
    Coin: defineNumberComponent(world, { id: "Coin", metadata: { contractId: "component.Coin" } }),
    Exits: defineNumberArrayComponent(world, "Exits", "component.Exits"),
    Genus: defineStringComponent(world, { id: "Genus", metadata: { contractId: "component.Genus" } }),
    Harmony: defineNumberComponent(world, { id: "Harmony", metadata: { contractId: "component.Harmony" } }),
    Health: defineNumberComponent(world, { id: "Health", metadata: { contractId: "component.Health" } }),
    HealthCurrent: defineNumberComponent(world, { id: "HealthCurrent", metadata: { contractId: "component.HealthCurrent" } }),
    Location: defineNumberComponent(world, { id: "Location", metadata: { contractId: "component.Location" } }),
    Status: defineStringComponent(world, { id: "Status", metadata: { contractId: "component.Status" } }),
    Value: defineStringComponent(world, { id: "Value", metadata: { contractId: "component.Value" } }),
    Affinity: defineStringComponent(world, { id: "Affinity", metadata: { contractId: "component.Affinity" } }),
    Power: defineNumberComponent(world, { id: "Power", metadata: { contractId: "component.Power" } }),
    PriceBuy: defineNumberComponent(world, { id: "PriceBuy", metadata: { contractId: "component.PriceBuy" } }),
    PriceSell: defineNumberComponent(world, { id: "PriceSell", metadata: { contractId: "component.PriceSell" } }),
    Slots: defineNumberComponent(world, { id: "Slots", metadata: { contractId: "component.Slots" } }),
    State: defineStringComponent(world, { id: "State", metadata: { contractId: "component.State" } }),
    Type: defineStringComponent(world, { id: "Type", metadata: { contractId: "component.Type" } }),
    Violence: defineNumberComponent(world, { id: "Violence", metadata: { contractId: "component.Violence" } }),

    // Times
    LastActionTime: defineNumberComponent(world, { id: "LastActionTime", metadata: { contractId: "component.time.LastAction" } }),
    StartTime: defineNumberComponent(world, { id: "StartTime", metadata: { contractId: "component.time.Start" } }),

    // speeeecial
    LoadingState: defineLoadingStateComponent(world),
    MediaURI: defineStringComponent(world, { id: "MediaURI", metadata: { contractId: "component.MediaURI" } }),
    Name: defineStringComponent(world, { id: "Name", metadata: { contractId: "component.Name" } }),
    PlayerAddress: defineStringComponent(world, { id: "PlayerAddress", metadata: { contractId: "component.Address.Operator" } }),
  }
}