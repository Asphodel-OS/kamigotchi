import { World } from '@latticexyz/recs';
import {
  defineBoolComponent,
  defineNumberComponent,
  defineStringComponent,
} from '@latticexyz/std-client';

import {
  defineLoadingStateComponent,
  defineLocationComponent,
  defineNumberArrayComponent,
  defineTimelockComponent,
} from './definitions';

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
    IsAccount: defineBoolEZ('IsAccount', 'component.Is.Account'),
    IsBonus: defineBoolEZ('IsBonus', 'component.Is.Bonus'),
    IsConfig: defineBoolEZ('IsConfig', 'component.Is.Config'),
    IsData: defineBoolEZ('IsData', 'component.Is.Data'),
    IsEffect: defineBoolEZ('IsEffect', 'component.Is.Effect'),
    IsFriendship: defineBoolEZ('IsFriendship', 'component.Is.Friendship'),
    IsInventory: defineBoolEZ('IsInventory', 'component.Is.Inventory'),
    IsKill: defineBoolEZ('IsKill', 'component.Is.Kill'),
    IsListing: defineBoolEZ('IsListing', 'component.Is.Listing'),
    IsLog: defineBoolEZ('IsLog', 'component.Is.Log'),
    IsLootbox: defineBoolEZ('IsLootbox', 'component.Is.Lootbox'),
    IsNPC: defineBoolEZ('IsNPC', 'component.Is.NPC'),
    IsNode: defineBoolEZ('IsNode', 'component.Is.Node'),
    IsPet: defineBoolEZ('IsPet', 'component.Is.Pet'),
    IsProduction: defineBoolEZ('IsProduction', 'component.Is.Production'),
    IsQuest: defineBoolEZ('IsQuest', 'component.Is.Quest'),
    IsObjective: defineBoolEZ('IsObjective', 'component.Is.Objective'),
    IsRegister: defineBoolEZ('IsRegister', 'component.Is.Register'),
    IsRegistry: defineBoolEZ('IsRegistry', 'component.Is.Registry'),
    IsRelationship: defineBoolEZ('IsRelationship', 'component.Is.Relationship'),
    IsRequest: defineBoolEZ('IsRequest', 'component.Is.Request'),
    IsRequirement: defineBoolEZ('IsRequirement', 'component.Is.Requirement'),
    IsReward: defineBoolEZ('IsReward', 'component.Is.Reward'),
    IsRoom: defineBoolEZ('IsRoom', 'component.Is.Room'),
    IsScore: defineBoolEZ('IsScore', 'component.Is.Score'),
    IsSkill: defineBoolEZ('IsSkill', 'component.Is.Skill'),
    IsTrade: defineBoolEZ('IsTrade', 'component.Is.Trade'),
    IsTrait: defineBoolEZ('IsTrait', 'component.Is.Trait'),

    // Properties and States
    IsComplete: defineBoolEZ('IsComplete', 'component.Is.Complete'),
    IsConsumable: defineBoolEZ('IsConsumable', 'component.Is.Consumable'),
    IsEquipped: defineBoolEZ('IsEquipped', 'component.Is.Equipped'),
    IsFungible: defineBoolEZ('IsFungible', 'component.Is.Fungible'),
    IsRepeatable: defineBoolEZ('IsRepeatable', 'component.Is.Repeatable'),

    // IDs
    AccountID: defineStringEZ('AccountID', 'component.Id.Account'),
    DelegateeID: defineStringEZ('DelegateeID', 'component.Id.Delegatee'),
    DelegatorID: defineStringEZ('DelegatorID', 'component.Id.Delegator'),
    HolderID: defineStringEZ('HolderID', 'component.Id.Holder'),
    NodeID: defineStringEZ('NodeID', 'component.Id.Node'),
    PetID: defineStringEZ('PetID', 'component.Id.Pet'),
    RequesteeID: defineStringEZ('RequesteeID', 'component.Id.Requestee'),
    RequesterID: defineStringEZ('RequesterID', 'component.Id.Requester'),
    SourceID: defineStringEZ('SourceID', 'component.Id.Source'),
    TargetID: defineStringEZ('TargetID', 'component.Id.Target'),

    // Indices
    Index: defineNumberEZ('Index', 'component.Index'), // generic index
    AccountIndex: defineNumberEZ('AccountIndex', 'component.Index.Account'),
    ItemIndex: defineNumberEZ('ItemIndex', 'component.Index.Item'),
    NodeIndex: defineNumberEZ('NodeIndex', 'component.Index.Node'),
    NPCIndex: defineNumberEZ('NPCIndex', 'component.Index.NPC'),
    ObjectiveIndex: defineNumberEZ('ObjectiveIndex', 'component.Index.Objective'),
    PetIndex: defineNumberEZ('PetIndex', 'component.Index.Pet'),
    QuestIndex: defineNumberEZ('QuestIndex', 'component.Index.Quest'),
    RelationshipIndex: defineNumberEZ('RelationshipIndex', 'component.Index.Relationship'),
    RoomIndex: defineNumberEZ('RoomIndex', 'component.Index.Room'),
    SkillIndex: defineNumberEZ('SkillIndex', 'component.Index.Skill'),
    SourceIndex: defineNumberEZ('SourceIndex', 'component.Index.Source'),
    TraitIndex: defineNumberEZ('PetIndex', 'component.Index.Trait'),

    BackgroundIndex: defineNumberEZ('BackgroundIndex', 'component.Index.Background'),
    BodyIndex: defineNumberEZ('BodyIndex', 'component.Index.Body'),
    ColorIndex: defineNumberEZ('ColorIndex', 'component.Index.Color'),
    FaceIndex: defineNumberEZ('FaceIndex', 'component.Index.Face'),
    HandIndex: defineNumberEZ('HandIndex', 'component.Index.Hand'),

    // Attributes
    Affinity: defineStringEZ('Affinity', 'component.Affinity'),
    Balance: defineNumberEZ('Balance', 'component.Balance'),
    Balances: defineNumberArrayComponent(world, 'Balances', 'component.Balances'),
    Blacklist: defineNumberArrayComponent(world, 'Blacklist', 'component.Blacklist'),
    Coin: defineNumberEZ('Coin', 'component.Coin'),
    Cost: defineNumberEZ('Cost', 'component.Cost'),
    Description: defineStringEZ('Description', 'component.Description'),
    Epoch: defineNumberEZ('Epoch', 'component.Epoch'),
    Exits: defineNumberArrayComponent(world, 'Exits', 'component.Exits'),
    Experience: defineNumberEZ('Experience', 'component.Experience'),
    For: defineNumberEZ('For', 'component.For'),
    Genus: defineStringEZ('Genus', 'component.Genus'),
    Harmony: defineNumberEZ('Harmony', 'component.Harmony'),
    Health: defineNumberEZ('Health', 'component.Health'),
    HealthCurrent: defineNumberEZ('HealthCurrent', 'component.Health.Current'),
    Keys: defineNumberArrayComponent(world, 'Keys', 'component.Keys'),
    Level: defineNumberEZ('Level', 'component.Level'),
    Location: defineLocationComponent(world, 'Location', 'component.Location'),
    LogicType: defineStringEZ('LogicType', 'component.LogicType'),
    Max: defineNumberEZ('Max', 'component.Max'),
    Name: defineStringEZ('Name', 'component.Name'),
    QuestPoint: defineNumberEZ('QuestPoint', 'component.QuestPoint'),
    Power: defineNumberEZ('Power', 'component.Power'),
    PriceBuy: defineNumberEZ('PriceBuy', 'component.PriceBuy'),
    PriceSell: defineNumberEZ('PriceSell', 'component.PriceSell'),
    Rarity: defineNumberEZ('Rarity', 'component.Rarity'),
    Reroll: defineNumberEZ('Rerolls', 'component.Reroll'),
    Rate: defineNumberEZ('Rate', 'component.Rate'),
    SkillPoint: defineNumberEZ('SkillPoint', 'component.SkillPoint'),
    Slots: defineNumberEZ('Slots', 'component.Slots'),
    Stamina: defineNumberEZ('Stamina', 'component.Stamina'),
    StaminaCurrent: defineNumberEZ('Stamina', 'component.Stamina.Current'),
    State: defineStringEZ('State', 'component.State'),
    Status: defineStringEZ('Status', 'component.Status'),
    Subtype: defineStringEZ('Subtype', 'component.Subtype'),
    Type: defineStringEZ('Type', 'component.Type'),
    Value: defineNumberEZ('Value', 'component.Value'),
    Violence: defineNumberEZ('Violence', 'component.Violence'),
    Weights: defineNumberArrayComponent(world, 'Weights', 'component.Weights'),
    Whitelist: defineNumberArrayComponent(world, 'Whitelist', 'component.Whitelist'),
    Wei: defineStringEZ('Wei', 'component.Wei'),

    Prototype: defineNumberEZ('Prototype', 'component.Prototype'),
    Upgrades: defineNumberEZ('Upgrades', 'component.Upgrades'),

    // Time/Block Tracking
    LastBlock: defineNumberEZ('BlockLast', 'component.Block.Last'),
    RevealBlock: defineNumberEZ('BlockReveal', 'component.Block.Reveal'),
    LastActionTime: defineNumberEZ('LastActionTime', 'component.Time.LastAction'),
    LastTime: defineNumberEZ('LastTime', 'component.Time.Last'),
    StartTime: defineNumberEZ('StartTime', 'component.Time.Start'),
    Time: defineNumberEZ('Time', 'component.Time'),
    Timelock: defineTimelockComponent(world),

    // speeeeecial
    CanName: defineBoolEZ('CanName', 'component.Can.Name'),
    GachaOrder: defineBoolEZ('CanName', 'component.Gacha.Order'),
    FavoriteFood: defineStringEZ('FavoriteFood', 'component.Favorite.Food'),
    LoadingState: defineLoadingStateComponent(world),
    MediaURI: defineStringEZ('MediaURI', 'component.MediaURI'),
    OperatorAddress: defineStringEZ('OperatorAddress', 'component.Address.Operator'),
    OwnerAddress: defineStringEZ('OwnerAddress', 'component.Address.Owner'),
  };
}
