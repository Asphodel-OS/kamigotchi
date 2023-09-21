import { Type, World, defineComponent } from "@latticexyz/recs";
import {
  defineBoolComponent,
  defineNumberComponent,
  defineStringComponent,
} from "@latticexyz/std-client";

import {
  defineLoadingStateComponent,
  defineNumberArrayComponent,
} from "./definitions";



// define functions for registration
export function createComponents(world: World) {
  // shortcut function for boolean component registration
  function defineBoolEZ(id: string, contractId: string) {
    return defineBoolComponent(world, { id, metadata: { contractId } });
  }

  // shortcut function for number component registration
  function defineNumberEZ(id: string, contractId: string) {
    return defineNumberComponent(world, { id, metadata: { contractId } });
  }

  // shortcut function for string component registration
  function defineStringEZ(id: string, contractId: string) {
    return defineStringComponent(world, { id, metadata: { contractId } });
  }

  return {
    // Archetypes
    IsAccount: defineBoolEZ("IsAccount", "component.Is.Account"),
    IsConfig: defineBoolEZ("IsConfig", "component.Is.Config"),
    IsComplete: defineBoolEZ("IsComplete", "component.Is.Complete"),
    IsData: defineBoolEZ("IsData", "component.Is.Data"),
    IsEffect: defineBoolEZ("IsEffect", "component.Is.Effect"),
    IsEquipped: defineBoolEZ("IsEquipped", "component.Is.Equipped"),
    IsFungible: defineBoolEZ("IsFungible", "component.Is.Fungible"),
    IsInventory: defineBoolEZ("IsInventory", "component.Is.Inventory"),
    IsKill: defineBoolEZ("IsKill", "component.Is.Kill"),
    IsListing: defineBoolEZ("IsListing", "component.Is.Listing"),
    IsNPC: defineBoolEZ("IsNPC", "component.Is.NPC"),
    IsNode: defineBoolEZ("IsNode", "component.Is.Node"),
    IsNonFungible: defineBoolEZ("IsNonFungible", "component.Is.NonFungible"),
    IsPet: defineBoolEZ("IsPet", "component.Is.Pet"),
    IsProduction: defineBoolEZ("IsProduction", "component.Is.Production"),
    IsQuest: defineBoolEZ("IsQuest", "component.Is.Quest"),
    IsObjective: defineBoolEZ("IsObjective", "component.Is.Objective"),
    IsRegister: defineBoolEZ("IsRegister", "component.Is.Register"),
    IsRegistry: defineBoolEZ("IsRegistry", "component.Is.Registry"),
    IsRequest: defineBoolEZ("IsRequest", "component.Is.Request"),
    IsRoom: defineBoolEZ("IsRoom", "component.Is.Room"),
    IsRequirement: defineBoolEZ("IsRequirement", "component.Is.Requirement"),
    IsReward: defineBoolEZ("IsReward", "component.Is.Reward"),
    IsScore: defineBoolEZ("IsScore", "component.Is.Score"),
    IsSkill: defineBoolEZ("IsSkill", "component.Is.Skill"),
    IsTrade: defineBoolEZ("IsTrade", "component.Is.Trade"),
    IsTrait: defineBoolEZ("IsTrait", "component.Is.Trait"),

    // IDs
    AccountID: defineStringEZ("AccountID", "component.Id.Account"),
    DelegateeID: defineStringEZ("DelegateeID", "component.Id.Delegatee"),
    DelegatorID: defineStringEZ("DelegatorID", "component.Id.Delegator"),
    HolderID: defineStringEZ("HolderID", "component.Id.Holder"),
    NodeID: defineStringEZ("NodeID", "component.Id.Node"),
    PetID: defineStringEZ("PetID", "component.Id.Pet"),
    RequesteeID: defineStringEZ("RequesteeID", "component.Id.Requestee"),
    RequesterID: defineStringEZ("RequesterID", "component.Id.Requester"),
    SourceID: defineStringEZ("SourceID", "component.Id.Source"),
    TargetID: defineStringEZ("TargetID", "component.Id.Target"),

    // Indices
    Index: defineNumberEZ("Index", "component.Index"), // generic index
    BackgroundIndex: defineNumberEZ("BackgroundIndex", "component.Index.Background"),
    BodyIndex: defineNumberEZ("BodyIndex", "component.Index.Body"),
    ColorIndex: defineNumberEZ("ColorIndex", "component.Index.Color"),
    FaceIndex: defineNumberEZ("FaceIndex", "component.Index.Face"),
    FoodIndex: defineNumberEZ("FoodIndex", "component.Index.Food"),
    GearIndex: defineNumberEZ("GearIndex", "component.Index.Gear"),
    HandIndex: defineNumberEZ("HandIndex", "component.Index.Hand"),
    ItemIndex: defineNumberEZ("ItemIndex", "component.Index.Item"),
    NPCIndex: defineNumberEZ("NPCIndex", "component.Index.NPC"),
    ModIndex: defineNumberEZ("ModIndex", "component.Index.Mod"),
    NodeIndex: defineNumberEZ("NodeIndex", "component.Index.Node"),
    ObjectiveIndex: defineNumberEZ("ObjectiveIndex", "component.Index.Objective"),
    QuestIndex: defineNumberEZ("QuestIndex", "component.Index.Quest"),
    PetIndex: defineNumberEZ("PetIndex", "component.Index.Pet"), // this should be updated to be a number component
    ReviveIndex: defineNumberEZ("ReviveIndex", "component.Index.Revive"), // this should be updated to be a number component
    SkillIndex: defineNumberEZ("SkillIndex", "component.Index.Skill"),
    TraitIndex: defineNumberEZ("PetIndex", "component.Index.Trait"), // this should be updated to be a number component

    // Values
    Affinity: defineStringEZ("Affinity", "component.Affinity"),
    Balance: defineNumberEZ("Balance", "component.Balance"),
    Coin: defineNumberEZ("Coin", "component.Coin"),
    Description: defineStringEZ("Description", "component.Description"),
    Epoch: defineNumberEZ("Epoch", "component.Epoch"),
    Exits: defineNumberArrayComponent(world, "Exits", "component.Exits"),
    Experience: defineNumberEZ("Experience", "component.Experience"),
    Genus: defineStringEZ("Genus", "component.Genus"),
    Harmony: defineNumberEZ("Harmony", "component.Harmony"),
    Health: defineNumberEZ("Health", "component.Health"),
    HealthCurrent: defineNumberEZ("HealthCurrent", "component.Health.Current"),
    Level: defineNumberEZ("Level", "component.Level"),
    Location: defineNumberEZ("Location", "component.Location"),
    LogicType: defineStringEZ("LogicType", "component.LogicType"),
    Name: defineStringEZ("Name", "component.Name"),
    Power: defineNumberEZ("Power", "component.Power"),
    PriceBuy: defineNumberEZ("PriceBuy", "component.PriceBuy"),
    PriceSell: defineNumberEZ("PriceSell", "component.PriceSell"),
    Prototype: defineNumberEZ("Prototype", "component.Prototype"),
    Rarity: defineNumberEZ("Rarity", "component.Rarity"),
    Rate: defineNumberEZ("Rate", "component.Rate"),
    SkillPoint: defineNumberEZ("SkillPoint", "component.SkillPoint"),
    Slots: defineNumberEZ("Slots", "component.Slots"),
    Stamina: defineNumberEZ("Stamina", "component.Stamina"),
    StaminaCurrent: defineNumberEZ("Stamina", "component.Stamina.Current"),
    State: defineStringEZ("State", "component.State"),
    Status: defineStringEZ("Status", "component.Status"),
    Type: defineStringEZ("Type", "component.Type"),
    Upgrades: defineNumberEZ("Upgrades", "component.Upgrades"),
    Value: defineNumberEZ("Value", "component.Value"),
    Violence: defineNumberEZ("Violence", "component.Violence"),

    // Time/Block Tracking
    LastBlock: defineNumberEZ("BlockLast", "component.Block.Last"),
    RevealBlock: defineNumberEZ("BlockReveal", "component.Block.Reveal"),
    LastTime: defineNumberEZ("LastTime", "component.Time.LastAction"),
    StartTime: defineNumberEZ("StartTime", "component.Time.Start"),
    Time: defineNumberEZ("Time", "component.Time"),

    // speeeeecial
    CanName: defineBoolEZ("CanName", "component.Can.Name"),
    LoadingState: defineLoadingStateComponent(world),
    MediaURI: defineStringEZ("MediaURI", "component.MediaURI"),
    OperatorAddress: defineStringEZ("OperatorAddress", "component.Address.Operator"),
    OwnerAddress: defineStringEZ("OwnerAddress", "component.Address.Owner"),

  }
}