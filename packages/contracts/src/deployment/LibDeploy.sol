// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// Foundry
import { DSTest } from "ds-test/test.sol";
import { console } from "forge-std/console.sol";
import { ICheats } from "../utils/ICheats.sol";

// Solecs
import { World } from "solecs/World.sol";
import { Component } from "solecs/Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { ISystem } from "solecs/interfaces/ISystem.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";

// Components
import { AddressOperatorComponent, ID as AddressOperatorComponentID } from "../components/AddressOperatorComponent.sol";
import { AddressOwnerComponent, ID as AddressOwnerComponentID } from "../components/AddressOwnerComponent.sol";
import { AffinityComponent, ID as AffinityComponentID } from "../components/AffinityComponent.sol";
import { BalanceComponent, ID as BalanceComponentID } from "../components/BalanceComponent.sol";
import { BalancesComponent, ID as BalancesComponentID } from "../components/BalancesComponent.sol";
import { BlacklistComponent, ID as BlacklistComponentID } from "../components/BlacklistComponent.sol";
import { BlockRevealComponent, ID as BlockRevealComponentID } from "../components/BlockRevealComponent.sol";
import { CanNameComponent, ID as CanNameComponentID } from "../components/CanNameComponent.sol";
import { CoinComponent, ID as CoinComponentID } from "../components/CoinComponent.sol";
import { CostComponent, ID as CostComponentID } from "../components/CostComponent.sol";
import { DescriptionComponent, ID as DescriptionComponentID } from "../components/DescriptionComponent.sol";
import { EpochComponent, ID as EpochComponentID } from "../components/EpochComponent.sol";
import { ExitsComponent, ID as ExitsComponentID } from "../components/ExitsComponent.sol";
import { ExperienceComponent, ID as ExperienceComponentID } from "../components/ExperienceComponent.sol";
import { FavoriteFoodComponent, ID as FavoriteFoodComponentID } from "../components/FavoriteFoodComponent.sol";
import { ForComponent, ID as ForComponentID } from "../components/ForComponent.sol";
import { GachaOrderComponent, ID as GachaOrderComponentID } from "../components/GachaOrderComponent.sol";
import { HarmonyComponent, ID as HarmonyComponentID } from "../components/HarmonyComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";
import { IdAccountComponent, ID as IdAccountComponentID } from "../components/IdAccountComponent.sol";
import { IdDelegateeComponent, ID as IdDelegateeComponentID } from "../components/IdDelegateeComponent.sol";
import { IdDelegatorComponent, ID as IdDelegatorComponentID } from "../components/IdDelegatorComponent.sol";
import { IdHolderComponent, ID as IdHolderComponentID } from "../components/IdHolderComponent.sol";
import { IdNodeComponent, ID as IdNodeComponentID } from "../components/IdNodeComponent.sol";
import { IdPetComponent, ID as IdPetComponentID } from "../components/IdPetComponent.sol";
import { IdSourceComponent, ID as IdSourceComponentID } from "../components/IdSourceComponent.sol";
import { IdTargetComponent, ID as IdTargetComponentID } from "../components/IdTargetComponent.sol";
import { IndexComponent, ID as IndexComponentID } from "../components/IndexComponent.sol";
import { IndexAccountComponent, ID as IndexAccountComponentID } from "../components/IndexAccountComponent.sol";
import { IndexBackgroundComponent, ID as IndexBackgroundComponentID } from "../components/IndexBackgroundComponent.sol";
import { IndexBodyComponent, ID as IndexBodyComponentID } from "../components/IndexBodyComponent.sol";
import { IndexColorComponent, ID as IndexColorComponentID } from "../components/IndexColorComponent.sol";
import { IndexFaceComponent, ID as IndexFaceComponentID } from "../components/IndexFaceComponent.sol";
import { IndexFarcasterComponent, ID as IndexFarcasterComponentID } from "../components/IndexFarcasterComponent.sol";
import { IndexHandComponent, ID as IndexHandComponentID } from "../components/IndexHandComponent.sol";
import { IndexItemComponent, ID as IndexItemComponentID } from "../components/IndexItemComponent.sol";
import { IndexNodeComponent, ID as IndexNodeComponentID } from "../components/IndexNodeComponent.sol";
import { IndexNPCComponent, ID as IndexNPCComponentID } from "../components/IndexNPCComponent.sol";
import { IndexObjectiveComponent, ID as IndexObjectiveComponentID } from "../components/IndexObjectiveComponent.sol";
import { IndexPetComponent, ID as IndexPetComponentID } from "../components/IndexPetComponent.sol";
import { IndexRelationshipComponent, ID as IndexRelationshipComponentID } from "../components/IndexRelationshipComponent.sol";
import { IndexQuestComponent, ID as IndexQuestComponentID } from "../components/IndexQuestComponent.sol";
import { IndexSkillComponent, ID as IndexSkillComponentID } from "../components/IndexSkillComponent.sol";
import { IndexSourceComponent, ID as IndexSourceComponentID } from "../components/IndexSourceComponent.sol";
import { IndexTraitComponent, ID as IndexTraitComponentID } from "../components/IndexTraitComponent.sol";
import { IsAccountComponent, ID as IsAccountComponentID } from "../components/IsAccountComponent.sol";
import { IsBonusComponent, ID as IsBonusComponentID } from "../components/IsBonusComponent.sol";
import { IsCompleteComponent, ID as IsCompleteComponentID } from "../components/IsCompleteComponent.sol";
import { IsConditionComponent, ID as IsConditionComponentID } from "../components/IsConditionComponent.sol";
import { IsConfigComponent, ID as IsConfigComponentID } from "../components/IsConfigComponent.sol";
import { IsConsumableComponent, ID as IsConsumableComponentID } from "../components/IsConsumableComponent.sol";
import { IsDataComponent, ID as IsDataComponentID } from "../components/IsDataComponent.sol";
import { IsEffectComponent, ID as IsEffectComponentID } from "../components/IsEffectComponent.sol";
import { IsEquippedComponent, ID as IsEquippedComponentID } from "../components/IsEquippedComponent.sol";
import { IsFriendshipComponent, ID as IsFriendshipComponentID } from "../components/IsFriendshipComponent.sol";
import { IsFungibleComponent, ID as IsFungibleComponentID } from "../components/IsFungibleComponent.sol";
import { IsInventoryComponent, ID as IsInventoryComponentID } from "../components/IsInventoryComponent.sol";
import { IsKillComponent, ID as IsKillComponentID } from "../components/IsKillComponent.sol";
import { IsListingComponent, ID as IsListingComponentID } from "../components/IsListingComponent.sol";
import { IsLogComponent, ID as IsLogComponentID } from "../components/IsLogComponent.sol";
import { IsLootboxComponent, ID as IsLootboxComponentID } from "../components/IsLootboxComponent.sol";
import { IsNodeComponent, ID as IsNodeComponentID } from "../components/IsNodeComponent.sol";
import { IsNPCComponent, ID as IsNPCComponentID } from "../components/IsNPCComponent.sol";
import { IsPetComponent, ID as IsPetComponentID } from "../components/IsPetComponent.sol";
import { IsProductionComponent, ID as IsProductionComponentID } from "../components/IsProductionComponent.sol";
import { IsRegistryComponent, ID as IsRegistryComponentID } from "../components/IsRegistryComponent.sol";
import { IsRelationshipComponent, ID as IsRelationshipComponentID } from "../components/IsRelationshipComponent.sol";
import { IsRepeatableComponent, ID as IsRepeatableComponentID } from "../components/IsRepeatableComponent.sol";
import { IsRequirementComponent, ID as IsRequirementComponentID } from "../components/IsRequirementComponent.sol";
import { IsRewardComponent, ID as IsRewardComponentID } from "../components/IsRewardComponent.sol";
import { IsRoomComponent, ID as IsRoomComponentID } from "../components/IsRoomComponent.sol";
import { IsObjectiveComponent, ID as IsObjectiveComponentID } from "../components/IsObjectiveComponent.sol";
import { IsQuestComponent, ID as IsQuestComponentID } from "../components/IsQuestComponent.sol";
import { IsScoreComponent, ID as IsScoreComponentID } from "../components/IsScoreComponent.sol";
import { IsSkillComponent, ID as IsSkillComponentID } from "../components/IsSkillComponent.sol";
import { KeysComponent, ID as KeysComponentID } from "../components/KeysComponent.sol";
import { LevelComponent, ID as LevelComponentID } from "../components/LevelComponent.sol";
import { LocationComponent, ID as LocationComponentID } from "../components/LocationComponent.sol";
import { IndexRoomComponent, ID as IndexRoomComponentID } from "../components/IndexRoomComponent.sol";
import { LogicTypeComponent, ID as LogicTypeComponentID } from "../components/LogicTypeComponent.sol";
import { MaxComponent, ID as MaxComponentID } from "../components/MaxComponent.sol";
import { MediaURIComponent, ID as MediaURIComponentID } from "../components/MediaURIComponent.sol";
import { NameComponent, ID as NameComponentID } from "../components/NameComponent.sol";
import { PowerComponent, ID as PowerComponentID } from "../components/PowerComponent.sol";
import { PriceBuyComponent, ID as PriceBuyComponentID } from "../components/PriceBuyComponent.sol";
import { PriceSellComponent, ID as PriceSellComponentID } from "../components/PriceSellComponent.sol";
import { ProxyPermissionsFarm20Component, ID as ProxyPermissionsFarm20ComponentID } from "../components/ProxyPermissionsFarm20Component.sol";
import { ProxyPermissionsERC721Component, ID as ProxyPermissionsERC721ComponentID } from "../components/ProxyPermissionsERC721Component.sol";
import { ProxyPermissionsMint20Component, ID as ProxyPermissionsMint20ComponentID } from "../components/ProxyPermissionsMint20Component.sol";
import { QuestPointComponent, ID as QuestPointComponentID } from "../components/QuestPointComponent.sol";
import { RarityComponent, ID as RarityComponentID } from "../components/RarityComponent.sol";
import { RateComponent, ID as RateComponentID } from "../components/RateComponent.sol";
import { RerollComponent, ID as RerollComponentID } from "../components/RerollComponent.sol";
import { SkillPointComponent, ID as SkillPointComponentID } from "../components/SkillPointComponent.sol";
import { SlotsComponent, ID as SlotsComponentID } from "../components/SlotsComponent.sol";
import { StaminaComponent, ID as StaminaComponentID } from "../components/StaminaComponent.sol";
import { StateComponent, ID as StateComponentID } from "../components/StateComponent.sol";
import { SubtypeComponent, ID as SubtypeComponentID } from "../components/SubtypeComponent.sol";
import { TimeComponent, ID as TimeComponentID } from "../components/TimeComponent.sol";
import { TimelockComponent, ID as TimelockComponentID } from "../components/TimelockComponent.sol";
import { TimeLastActionComponent, ID as TimeLastActionComponentID } from "../components/TimeLastActionComponent.sol";
import { TimeLastComponent, ID as TimeLastComponentID } from "../components/TimeLastComponent.sol";
import { TimeStartComponent, ID as TimeStartComponentID } from "../components/TimeStartComponent.sol";
import { TypeComponent, ID as TypeComponentID } from "../components/TypeComponent.sol";
import { ValueComponent, ID as ValueComponentID } from "../components/ValueComponent.sol";
import { ViolenceComponent, ID as ViolenceComponentID } from "../components/ViolenceComponent.sol";
import { WeiComponent, ID as WeiComponentID } from "../components/WeiComponent.sol";
import { WeightsComponent, ID as WeightsComponentID } from "../components/WeightsComponent.sol";
import { WhitelistComponent, ID as WhitelistComponentID } from "../components/WhitelistComponent.sol";

// Systems
import { AccountRegisterSystem, ID as AccountRegisterSystemID } from "../systems/AccountRegisterSystem.sol";

struct DeployResult {
World world;
address deployer;
}

library LibDeploy {
function deploy(
address _deployer,
address _world,
bool _reuseComponents
) internal returns (DeployResult memory result) {
result.deployer = _deployer;

// ------------------------
// Deploy
// ------------------------

// Deploy world
result.world = _world == address(0) ? new World() : World(_world);
if(_world == address(0)) result.world.init(); // Init if it's a fresh world

// Deploy components
if(!_reuseComponents) {
IComponent comp;

console.log("Deploying AddressOperatorComponent");
comp = new AddressOperatorComponent(address(result.world));
console.log(address(comp));

console.log("Deploying AddressOwnerComponent");
comp = new AddressOwnerComponent(address(result.world));
console.log(address(comp));

console.log("Deploying AffinityComponent");
comp = new AffinityComponent(address(result.world));
console.log(address(comp));

console.log("Deploying BalanceComponent");
comp = new BalanceComponent(address(result.world));
console.log(address(comp));

console.log("Deploying BalancesComponent");
comp = new BalancesComponent(address(result.world));
console.log(address(comp));

console.log("Deploying BlacklistComponent");
comp = new BlacklistComponent(address(result.world));
console.log(address(comp));

console.log("Deploying BlockRevealComponent");
comp = new BlockRevealComponent(address(result.world));
console.log(address(comp));

console.log("Deploying CanNameComponent");
comp = new CanNameComponent(address(result.world));
console.log(address(comp));

console.log("Deploying CoinComponent");
comp = new CoinComponent(address(result.world));
console.log(address(comp));

console.log("Deploying CostComponent");
comp = new CostComponent(address(result.world));
console.log(address(comp));

console.log("Deploying DescriptionComponent");
comp = new DescriptionComponent(address(result.world));
console.log(address(comp));

console.log("Deploying EpochComponent");
comp = new EpochComponent(address(result.world));
console.log(address(comp));

console.log("Deploying ExitsComponent");
comp = new ExitsComponent(address(result.world));
console.log(address(comp));

console.log("Deploying ExperienceComponent");
comp = new ExperienceComponent(address(result.world));
console.log(address(comp));

console.log("Deploying FavoriteFoodComponent");
comp = new FavoriteFoodComponent(address(result.world));
console.log(address(comp));

console.log("Deploying ForComponent");
comp = new ForComponent(address(result.world));
console.log(address(comp));

console.log("Deploying GachaOrderComponent");
comp = new GachaOrderComponent(address(result.world));
console.log(address(comp));

console.log("Deploying HarmonyComponent");
comp = new HarmonyComponent(address(result.world));
console.log(address(comp));

console.log("Deploying HealthComponent");
comp = new HealthComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IdAccountComponent");
comp = new IdAccountComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IdDelegateeComponent");
comp = new IdDelegateeComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IdDelegatorComponent");
comp = new IdDelegatorComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IdHolderComponent");
comp = new IdHolderComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IdNodeComponent");
comp = new IdNodeComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IdPetComponent");
comp = new IdPetComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IdSourceComponent");
comp = new IdSourceComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IdTargetComponent");
comp = new IdTargetComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexComponent");
comp = new IndexComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexAccountComponent");
comp = new IndexAccountComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexBackgroundComponent");
comp = new IndexBackgroundComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexBodyComponent");
comp = new IndexBodyComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexColorComponent");
comp = new IndexColorComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexFaceComponent");
comp = new IndexFaceComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexFarcasterComponent");
comp = new IndexFarcasterComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexHandComponent");
comp = new IndexHandComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexItemComponent");
comp = new IndexItemComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexNodeComponent");
comp = new IndexNodeComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexNPCComponent");
comp = new IndexNPCComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexObjectiveComponent");
comp = new IndexObjectiveComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexPetComponent");
comp = new IndexPetComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexRelationshipComponent");
comp = new IndexRelationshipComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexQuestComponent");
comp = new IndexQuestComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexSkillComponent");
comp = new IndexSkillComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexSourceComponent");
comp = new IndexSourceComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexTraitComponent");
comp = new IndexTraitComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsAccountComponent");
comp = new IsAccountComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsBonusComponent");
comp = new IsBonusComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsCompleteComponent");
comp = new IsCompleteComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsConditionComponent");
comp = new IsConditionComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsConfigComponent");
comp = new IsConfigComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsConsumableComponent");
comp = new IsConsumableComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsDataComponent");
comp = new IsDataComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsEffectComponent");
comp = new IsEffectComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsEquippedComponent");
comp = new IsEquippedComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsFriendshipComponent");
comp = new IsFriendshipComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsFungibleComponent");
comp = new IsFungibleComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsInventoryComponent");
comp = new IsInventoryComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsKillComponent");
comp = new IsKillComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsListingComponent");
comp = new IsListingComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsLogComponent");
comp = new IsLogComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsLootboxComponent");
comp = new IsLootboxComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsNodeComponent");
comp = new IsNodeComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsNPCComponent");
comp = new IsNPCComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsPetComponent");
comp = new IsPetComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsProductionComponent");
comp = new IsProductionComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsRegistryComponent");
comp = new IsRegistryComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsRelationshipComponent");
comp = new IsRelationshipComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsRepeatableComponent");
comp = new IsRepeatableComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsRequirementComponent");
comp = new IsRequirementComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsRewardComponent");
comp = new IsRewardComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsRoomComponent");
comp = new IsRoomComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsObjectiveComponent");
comp = new IsObjectiveComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsQuestComponent");
comp = new IsQuestComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsScoreComponent");
comp = new IsScoreComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IsSkillComponent");
comp = new IsSkillComponent(address(result.world));
console.log(address(comp));

console.log("Deploying KeysComponent");
comp = new KeysComponent(address(result.world));
console.log(address(comp));

console.log("Deploying LevelComponent");
comp = new LevelComponent(address(result.world));
console.log(address(comp));

console.log("Deploying LocationComponent");
comp = new LocationComponent(address(result.world));
console.log(address(comp));

console.log("Deploying IndexRoomComponent");
comp = new IndexRoomComponent(address(result.world));
console.log(address(comp));

console.log("Deploying LogicTypeComponent");
comp = new LogicTypeComponent(address(result.world));
console.log(address(comp));

console.log("Deploying MaxComponent");
comp = new MaxComponent(address(result.world));
console.log(address(comp));

console.log("Deploying MediaURIComponent");
comp = new MediaURIComponent(address(result.world));
console.log(address(comp));

console.log("Deploying NameComponent");
comp = new NameComponent(address(result.world));
console.log(address(comp));

console.log("Deploying PowerComponent");
comp = new PowerComponent(address(result.world));
console.log(address(comp));

console.log("Deploying PriceBuyComponent");
comp = new PriceBuyComponent(address(result.world));
console.log(address(comp));

console.log("Deploying PriceSellComponent");
comp = new PriceSellComponent(address(result.world));
console.log(address(comp));

console.log("Deploying ProxyPermissionsFarm20Component");
comp = new ProxyPermissionsFarm20Component(address(result.world));
console.log(address(comp));

console.log("Deploying ProxyPermissionsERC721Component");
comp = new ProxyPermissionsERC721Component(address(result.world));
console.log(address(comp));

console.log("Deploying ProxyPermissionsMint20Component");
comp = new ProxyPermissionsMint20Component(address(result.world));
console.log(address(comp));

console.log("Deploying QuestPointComponent");
comp = new QuestPointComponent(address(result.world));
console.log(address(comp));

console.log("Deploying RarityComponent");
comp = new RarityComponent(address(result.world));
console.log(address(comp));

console.log("Deploying RateComponent");
comp = new RateComponent(address(result.world));
console.log(address(comp));

console.log("Deploying RerollComponent");
comp = new RerollComponent(address(result.world));
console.log(address(comp));

console.log("Deploying SkillPointComponent");
comp = new SkillPointComponent(address(result.world));
console.log(address(comp));

console.log("Deploying SlotsComponent");
comp = new SlotsComponent(address(result.world));
console.log(address(comp));

console.log("Deploying StaminaComponent");
comp = new StaminaComponent(address(result.world));
console.log(address(comp));

console.log("Deploying StateComponent");
comp = new StateComponent(address(result.world));
console.log(address(comp));

console.log("Deploying SubtypeComponent");
comp = new SubtypeComponent(address(result.world));
console.log(address(comp));

console.log("Deploying TimeComponent");
comp = new TimeComponent(address(result.world));
console.log(address(comp));

console.log("Deploying TimelockComponent");
comp = new TimelockComponent(address(result.world));
console.log(address(comp));

console.log("Deploying TimeLastActionComponent");
comp = new TimeLastActionComponent(address(result.world));
console.log(address(comp));

console.log("Deploying TimeLastComponent");
comp = new TimeLastComponent(address(result.world));
console.log(address(comp));

console.log("Deploying TimeStartComponent");
comp = new TimeStartComponent(address(result.world));
console.log(address(comp));

console.log("Deploying TypeComponent");
comp = new TypeComponent(address(result.world));
console.log(address(comp));

console.log("Deploying ValueComponent");
comp = new ValueComponent(address(result.world));
console.log(address(comp));

console.log("Deploying ViolenceComponent");
comp = new ViolenceComponent(address(result.world));
console.log(address(comp));

console.log("Deploying WeiComponent");
comp = new WeiComponent(address(result.world));
console.log(address(comp));

console.log("Deploying WeightsComponent");
comp = new WeightsComponent(address(result.world));
console.log(address(comp));

console.log("Deploying WhitelistComponent");
comp = new WhitelistComponent(address(result.world));
console.log(address(comp));

}

deploySystems(address(result.world), true);
}


function authorizeWriter(
IUint256Component components,
uint256 componentId,
address writer
) internal {
Component(getAddressById(components, componentId)).authorizeWriter(writer);
}

function deploySystems(address _world, bool init) internal {
World world = World(_world);
// Deploy systems
ISystem system;
IUint256Component components = world.components();

console.log("Deploying AccountRegisterSystem");
system = new AccountRegisterSystem(world, address(components));
world.registerSystem(address(system), AccountRegisterSystemID);
authorizeWriter(components, IsAccountComponentID, address(system));
authorizeWriter(components, IndexAccountComponentID, address(system));
authorizeWriter(components, AddressOperatorComponentID, address(system));
authorizeWriter(components, AddressOwnerComponentID, address(system));
authorizeWriter(components, FavoriteFoodComponentID, address(system));
authorizeWriter(components, IndexRoomComponentID, address(system));
authorizeWriter(components, NameComponentID, address(system));
authorizeWriter(components, StaminaComponentID, address(system));
authorizeWriter(components, TimeLastActionComponentID, address(system));
authorizeWriter(components, TimeLastComponentID, address(system));
authorizeWriter(components, TimeStartComponentID, address(system));
console.log(address(system));

}
}