import { World } from '@mud-classic/recs';

import {
  defineBoolComponent,
  defineLoadingStateComponent,
  defineLocationComponent,
  defineNumberArrayComponent,
  defineNumberComponent,
  defineStatComponent,
  defineStringComponent,
  defineTimelockComponent,
} from './definitions';

export type Components = ReturnType<typeof createComponents>;

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
    IsAccount: defineBoolEZ('IsAccount', 'component.is.account'),
    IsBonus: defineBoolEZ('IsBonus', 'component.is.bonus'),
    IsCondition: defineBoolEZ('IsCondition', 'component.is.condition'),
    IsEffect: defineBoolEZ('IsEffect', 'component.is.effect'),
    IsFriendship: defineBoolEZ('IsFriendship', 'component.is.friendship'),
    IsInventory: defineBoolEZ('IsInventory', 'component.is.inventory'),
    IsKill: defineBoolEZ('IsKill', 'component.is.kill'),
    IsListing: defineBoolEZ('IsListing', 'component.is.listing'),
    IsLog: defineBoolEZ('IsLog', 'component.is.log'),
    IsLootbox: defineBoolEZ('IsLootbox', 'component.is.lootbox'),
    IsNode: defineBoolEZ('IsNode', 'component.is.node'),
    IsNPC: defineBoolEZ('IsNPC', 'component.is.npc'),
    IsObjective: defineBoolEZ('IsObjective', 'component.is.objective'),
    IsPet: defineBoolEZ('IsPet', 'component.is.pet'),
    IsProduction: defineBoolEZ('IsProduction', 'component.is.production'),
    IsQuest: defineBoolEZ('IsQuest', 'component.is.quest'),
    IsRegister: defineBoolEZ('IsRegister', 'component.is.register'),
    IsRegistry: defineBoolEZ('IsRegistry', 'component.is.registry'),
    IsRelationship: defineBoolEZ('IsRelationship', 'component.is.relationship'),
    IsRequest: defineBoolEZ('IsRequest', 'component.is.request'),
    IsRequirement: defineBoolEZ('IsRequirement', 'component.is.requirement'),
    IsReward: defineBoolEZ('IsReward', 'component.is.reward'),
    IsRoom: defineBoolEZ('IsRoom', 'component.is.room'),
    IsScore: defineBoolEZ('IsScore', 'component.is.score'),
    IsSkill: defineBoolEZ('IsSkill', 'component.is.skill'),
    IsTrade: defineBoolEZ('IsTrade', 'component.is.trade'),

    // Properties and States
    IsComplete: defineBoolEZ('IsComplete', 'component.is.complete'),
    IsConsumable: defineBoolEZ('IsConsumable', 'component.is.consumable'),
    IsEquipped: defineBoolEZ('IsEquipped', 'component.is.equipped'),
    IsRepeatable: defineBoolEZ('IsRepeatable', 'component.is.repeatable'),

    // IDs
    AccountID: defineStringEZ('AccountID', 'component.id.account'),
    DelegateeID: defineStringEZ('DelegateeID', 'component.id.delegatee'),
    DelegatorID: defineStringEZ('DelegatorID', 'component.id.delegator'),
    HolderID: defineStringEZ('HolderID', 'component.id.holder'),
    NodeID: defineStringEZ('NodeID', 'component.id.node'),
    OwnsConditionID: defineStringEZ('OwnsConditionID', 'component.id.condition.owns'),
    OwnsInventoryID: defineStringEZ('OwnsInventoryID', 'component.id.inventory.owns'),
    OwnsPetID: defineStringEZ('OwnsPetID', 'component.id.pet.owns'),
    OwnsQuestID: defineStringEZ('OwnsQuestID', 'component.id.quest.owns'),
    OwnsRelationshipID: defineStringEZ('OwnsRelationshipID', 'component.id.relationship.owns'),
    PetID: defineStringEZ('PetID', 'component.id.pet'),
    RequesteeID: defineStringEZ('RequesteeID', 'component.id.requestee'),
    RequesterID: defineStringEZ('RequesterID', 'component.id.requester'),
    RoomID: defineStringEZ('RoomID', 'component.id.room'),
    SourceID: defineStringEZ('SourceID', 'component.id.source'),
    TargetID: defineStringEZ('TargetID', 'component.id.target'),

    // Indices
    Index: defineNumberEZ('Index', 'component.index'), // generic index
    AccountIndex: defineNumberEZ('AccountIndex', 'component.index.account'),
    BackgroundIndex: defineNumberEZ('BackgroundIndex', 'component.index.background'),
    BodyIndex: defineNumberEZ('BodyIndex', 'component.index.body'),
    ColorIndex: defineNumberEZ('ColorIndex', 'component.index.color'),
    FaceIndex: defineNumberEZ('FaceIndex', 'component.index.face'),
    FarcasterIndex: defineNumberEZ('FarcasterIndex', 'component.index.farcaster'),
    HandIndex: defineNumberEZ('HandIndex', 'component.index.hand'),
    ItemIndex: defineNumberEZ('ItemIndex', 'component.index.item'),
    NodeIndex: defineNumberEZ('NodeIndex', 'component.index.node'),
    NPCIndex: defineNumberEZ('NPCIndex', 'component.index.npc'),
    PetIndex: defineNumberEZ('PetIndex', 'component.index.pet'),
    QuestIndex: defineNumberEZ('QuestIndex', 'component.index.quest'),
    RelationshipIndex: defineNumberEZ('RelationshipIndex', 'component.index.relationship'),
    RoomIndex: defineNumberEZ('RoomIndex', 'component.index.room'),
    SkillIndex: defineNumberEZ('SkillIndex', 'component.index.skill'),
    Exits: defineNumberArrayComponent(world, 'Exits', 'component.exits'),
    Keys: defineNumberArrayComponent(world, 'Keys', 'component.keys'),
    Blacklist: defineNumberArrayComponent(world, 'Blacklist', 'component.blacklist'),
    Whitelist: defineNumberArrayComponent(world, 'Whitelist', 'component.whitelist'),

    // Stat Attributes
    Health: defineStatComponent(world, 'Health', 'component.stat.health'),
    Harmony: defineStatComponent(world, 'Harmony', 'component.stat.harmony'),
    Power: defineStatComponent(world, 'Power', 'component.stat.power'),
    Slots: defineStatComponent(world, 'Slots', 'component.stat.slots'),
    Stamina: defineStatComponent(world, 'Stamina', 'component.stat.stamina'),
    Violence: defineStatComponent(world, 'Violence', 'component.stat.violence'),

    // General Attributes
    Affinity: defineStringEZ('Affinity', 'component.affiinity'),
    Balance: defineNumberEZ('Balance', 'component.balance'),
    Balances: defineNumberArrayComponent(world, 'Balances', 'component.balances'),
    BalanceSigned: defineNumberEZ('Balance', 'component.balance.signed'),
    BareValue: defineNumberEZ('BareValue', 'component.barevalue'),
    Coin: defineNumberEZ('Coin', 'component.coin'),
    Cost: defineNumberEZ('Cost', 'component.cost'),
    Description: defineStringEZ('Description', 'component.description'),
    DescriptionAlt: defineStringEZ('Description', 'component.description.alt'),
    Epoch: defineNumberEZ('Epoch', 'component.epoch'),
    Experience: defineNumberEZ('Experience', 'component.experience'),
    For: defineNumberEZ('For', 'component.for'),
    Hash: defineStringEZ('Hash', 'component.hash'),
    Level: defineNumberEZ('Level', 'component.level'),
    Location: defineLocationComponent(world, 'Location', 'component.location'),
    LogicType: defineStringEZ('LogicType', 'component.logictype'),
    Max: defineNumberEZ('Max', 'component.max'),
    Name: defineStringEZ('Name', 'component.name'),
    PriceBuy: defineNumberEZ('PriceBuy', 'component.price.buy'),
    PriceSell: defineNumberEZ('PriceSell', 'component.price.sell'),
    QuestPoint: defineNumberEZ('QuestPoint', 'component.quest.point'),
    Rarity: defineNumberEZ('Rarity', 'component.rarity'),
    Rate: defineNumberEZ('Rate', 'component.rate'),
    Reroll: defineNumberEZ('Rerolls', 'component.reroll'),
    SkillPoint: defineNumberEZ('SkillPoint', 'component.skill.point'),
    State: defineStringEZ('State', 'component.state'),
    Subtype: defineStringEZ('Subtype', 'component.subtype'),
    Type: defineStringEZ('Type', 'component.type'),
    Value: defineNumberEZ('Value', 'component.value'),
    Weights: defineNumberArrayComponent(world, 'Weights', 'component.weights'),

    // Time/Block Tracking
    LastBlock: defineNumberEZ('BlockLast', 'component.block.last'),
    RevealBlock: defineNumberEZ('BlockReveal', 'component.block.reveal'),
    LastActionTime: defineNumberEZ('LastActionTime', 'component.Time.LastAction'),
    LastTime: defineNumberEZ('LastTime', 'component.Time.Last'),
    StartTime: defineNumberEZ('StartTime', 'component.Time.Start'),
    Time: defineNumberEZ('Time', 'component.Time'),
    Timelock: defineTimelockComponent(world),

    // speeeeecial
    CanName: defineBoolEZ('CanName', 'component.can.name'),
    LoadingState: defineLoadingStateComponent(world),
    MediaURI: defineStringEZ('MediaURI', 'component.mediaURI'),
    OperatorAddress: defineStringEZ('OperatorAddress', 'component.address.operator'),
    OperatorCache: defineNumberEZ('OperatorCache', 'component.cache.operator'),
    OwnerAddress: defineStringEZ('OwnerAddress', 'component.address.owner'),
  };
}
