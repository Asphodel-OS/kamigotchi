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

// shortcut function for boolean component registration
function defineBoolEZ(world: any, id: string, contractId: string) {
  return defineBoolComponent(world, { id, metadata: { contractId } });
}

// shortcut function for number component registration
function defineNumberEZ(world: any, id: string, contractId: string) {
  return defineNumberComponent(world, { id, metadata: { contractId } });
}

// shortcut function for string component registration
function defineStringEZ(world: any, id: string, contractId: string) {
  return defineStringComponent(world, { id, metadata: { contractId } });
}


// define functions for registration
export function createComponents(world: any) {
  return {
    // Archetypes
    IsAccount: defineBoolEZ(world, "IsAccount", "component.Is.Account"),
    IsEquipped: defineBoolEZ(world, "IsEquipped", "component.Is.Equipped"),
    IsFood: defineBoolEZ(world, "IsFood", "component.Is.Food"),
    IsFungible: defineBoolEZ(world, "IsFungible", "component.Is.Fungible"),
    IsInventory: defineBoolEZ(world, "IsInventory", "component.Is.Inventory"),
    IsListing: defineBoolEZ(world, "IsListing", "component.Is.Listing"),
    IsMerchant: defineBoolEZ(world, "IsMerchant", "component.Is.Merchant"),
    IsModifier: defineBoolEZ(world, "IsModifier", "component.Is.Modifier"),
    IsNode: defineBoolEZ(world, "IsNode", "component.Is.Node"),
    IsNonFungible: defineBoolEZ(world, "IsNonFungible", "component.Is.NonFungible"),
    IsPet: defineBoolEZ(world, "IsPet", "component.Is.Pet"),
    IsProduction: defineBoolEZ(world, "IsProduction", "component.Is.Production"),
    IsRegister: defineBoolEZ(world, "IsRegister", "component.Is.Register"),
    IsRegistry: defineBoolEZ(world, "IsRegistry", "component.Is.Registry"),
    IsRegistryEntry: defineBoolEZ(world, "IsRegistryEntry", "component.Is.RegistryEntry"),
    IsRequest: defineBoolEZ(world, "IsRequest", "component.Is.Request"),
    IsRoom: defineBoolEZ(world, "IsRoom", "component.Is.Room"),
    IsTrade: defineBoolEZ(world, "IsTrade", "component.Is.Trade"),

    // IDs
    AccountID: defineStringEZ(world, "AccountID", "component.Id.Account"),
    DelegateeID: defineStringEZ(world, "DelegateeID", "component.Id.Delegatee"),
    DelegatorID: defineStringEZ(world, "DelegatorID", "component.Id.Delegator"),
    HolderID: defineStringEZ(world, "HolderID", "component.Id.Holder"),
    MerchantID: defineStringEZ(world, "MerchantID", "component.Id.Merchant"),
    NodeID: defineStringEZ(world, "NodeID", "component.Id.Node"),
    OwnerID: defineStringEZ(world, "OwnerID", "component.Id.Owner"),
    PetID: defineStringEZ(world, "PetID", "component.Id.Pet"),
    RequesteeID: defineStringEZ(world, "RequesteeID", "component.Id.Requestee"),
    RequesterID: defineStringEZ(world, "RequesterID", "component.Id.Requester"),

    // Indices
    FoodIndex: defineNumberEZ(world, "FoodIndex", "component.Index.Food"),
    GearIndex: defineNumberEZ(world, "GearIndex", "component.Index.Gear"),
    ItemIndex: defineNumberEZ(world, "ItemIndex", "component.Index.Item"),
    ModIndex: defineNumberEZ(world, "ModIndex", "component.Index.Mod"),
    ModifierIndex: defineNumberEZ(world, "ModifierIndex", "component.Index.Modifier"),
    PetIndex: defineStringEZ(world, "PetIndex", "component.Index.Pet"), // this should be updated to be a number component

    // Values
    Affinity: defineStringEZ(world, "Affinity", "component.Affinity"),
    Balance: defineNumberEZ(world, "Balance", "component.Balance"),
    Coin: defineNumberEZ(world, "Coin", "component.Coin"),
    Exits: defineNumberArrayComponent(world, "Exits", "component.Exits"),
    Genus: defineStringEZ(world, "Genus", "component.Genus"),
    Harmony: defineNumberEZ(world, "Harmony", "component.Harmony"),
    Health: defineNumberEZ(world, "Health", "component.Health"),
    HealthCurrent: defineNumberEZ(world, "HealthCurrent", "component.HealthCurrent"),
    Location: defineNumberEZ(world, "Location", "component.Location"),
    Name: defineStringEZ(world, "Name", "component.Name"),
    Power: defineNumberEZ(world, "Power", "component.Power"),
    PriceBuy: defineNumberEZ(world, "PriceBuy", "component.PriceBuy"),
    PriceSell: defineNumberEZ(world, "PriceSell", "component.PriceSell"),
    Prototype: defineNumberEZ(world, "Prototype", "component.Prototype"),
    Slots: defineNumberEZ(world, "Slots", "component.Slots"),
    State: defineStringEZ(world, "State", "component.State"),
    Status: defineStringEZ(world, "Status", "component.Status"),
    Type: defineStringEZ(world, "Type", "component.Type"),
    Upgrades: defineNumberEZ(world, "Upgrades", "component.Upgrades"),
    Value: defineStringEZ(world, "Value", "component.Value"),
    Violence: defineNumberEZ(world, "Violence", "component.Violence"),

    // Time/Block Tracking
    BlockLast: defineNumberEZ(world, "BlockLast", "component.BlockLast"),
    LastActionTime: defineNumberEZ(world, "LastActionTime", "component.time.LastAction"),
    StartTime: defineNumberEZ(world, "StartTime", "component.time.Start"),

    // speeeecial
    LoadingState: defineLoadingStateComponent(world),
    MediaURI: defineStringEZ(world, "MediaURI", "component.MediaURI"),
    PlayerAddress: defineStringEZ(world, "PlayerAddress", "component.Address.Operator"),
  }
}