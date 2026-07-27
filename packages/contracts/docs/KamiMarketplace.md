# Kami Marketplace

An on-chain orderbook for bridged-out Kamis (`721_EXTERNAL` state). Follows an OpenSea-style model: **ETH** for instant buys, **WETH** for offers and collection offers (approval-based, no escrow).

---

## Table of Contents

- [Architecture](#architecture)
- [Currency Model](#currency-model)
- [Kami Transfer Model](#kami-transfer-model)
- [Entity Model](#entity-model)
- [Configuration](#configuration)
- [Contracts](#contracts)
  - [KamiMarketVault](#kamimarketvault)
  - [IDOwnsKamiOrderComponent](#idownskamiordercomponent)
  - [LibKamiMarket](#libkamimarket)
  - [Systems](#systems)
- [Flows](#flows)
  - [List a Kami](#list-a-kami)
  - [Buy Listings (Batch, ETH)](#buy-listings-batch-eth)
  - [Create Offer (Specific)](#create-offer-specific)
  - [Create Collection Offer](#create-collection-offer)
  - [Accept Offer](#accept-offer)
  - [Cancel Order](#cancel-order)
  - [Admin Cancel](#admin-cancel)
- [Fee Model](#fee-model)
- [Events](#events)
- [Data Logging](#data-logging)
- [Client Integration](#client-integration)
- [Security Considerations](#security-considerations)
- [File Map](#file-map)

---

## Architecture

```
  Setup:
    Sellers: Kami721.setApprovalForAll(vault, true)     // one-time
    Buyers:  WETH.approve(vault, maxUint)               // one-time

  Listings (ETH):
    [Buyer] --ETH--> BuySystem --vault.transferKami()--> [Buyer gets Kami]
                          |---ETH-fee--> [Seller]
                          |---fee------> [Treasury]

  Offers (WETH):
    [Seller] --> AcceptOfferSystem --vault.transferKami()--> [Buyer gets Kami]
                          |---vault.transferWETH()--> [Seller gets WETH-fee]
                          |---vault.transferWETH()--> [Treasury gets fee]

  Note: No escrow. Kami stays in seller's wallet until purchase.
        KamiMarketVault is the persistent approval target for both
        Kami721 and WETH, surviving system upgrades.
```

The system is composed of:

- **5 user-facing systems** (list, buy, offer, accept-offer, cancel)
- **1 admin system** (registry for configuration)
- **1 library** (`LibKamiMarket`) containing all business logic
- **1 persistent vault** (`KamiMarketVault`) for WETH and Kami721 transfers
- **1 new component** (`IDOwnsKamiOrderComponent`) for order ownership

---

## Currency Model

| Action | Currency | Mechanism |
|--------|----------|-----------|
| Buy a listing | **ETH** | Buyer sends `msg.value`. Seller receives ETH minus fee. |
| Create an offer | **WETH** | No transfer. Buyer pre-approves `KamiMarketVault` to spend WETH. |
| Accept an offer | **WETH** | Vault pulls WETH from buyer via `transferFrom`. |

Listings use native ETH because the buyer initiates and can send value directly. Offers use WETH because the seller initiates acceptance asynchronously, requiring a pre-approved `transferFrom` pattern.

---

## Kami Transfer Model

**No escrow.** Like OpenSea, the seller keeps the kami in their wallet while it's listed. The kami's ECS state is set to `"LISTED"` to mark it, but the ERC-721 token stays with the seller.

All kami transfers go through the `KamiMarketVault` using standard ERC-721 `transferFrom`. Sellers approve the vault once (via `Kami721.setApprovalForAll(vaultAddress, true)`), and the vault persists across system upgrades.

- **Listing**: Kami state set to `"LISTED"`. **No token movement** — kami stays in seller's wallet.
- **Buy**: State restored to `"721_EXTERNAL"`, then `vault.transferKami(seller, buyer, tokenId)` calls `Kami721.transferFrom`.
- **Accept offer**: `vault.transferKami(seller, buyer, tokenId)` — direct ERC-721 transfer. Works for both `"721_EXTERNAL"` and `"LISTED"` kamis (if listed, state is restored first).
- **Cancel listing**: Kami state restored to `"721_EXTERNAL"`. No token movement needed.

### Seller Approval

Sellers must approve the `KamiMarketVault` for Kami721 transfers before listing or accepting offers:

```solidity
Kami721.setApprovalForAll(vaultAddress, true);  // one-time, survives system upgrades
```

This mirrors the OpenSea model where sellers approve the Seaport conduit contract.

### Bridge-in Prevention

The `"LISTED"` state prevents bridging a listed kami back into the game. `LibKami.isInWorld()` returns `true` for any state other than `"721_EXTERNAL"`, so the `Kami721StakeSystem`'s `require(!LibKami.isInWorld(...))` check naturally rejects listed kamis.

### Stale Listings

Because there's no escrow, a listing can become stale when the listed kami changes ownership through another valid path:

1. **Seller accepts an offer** — If a seller accepts a WETH offer for a listed kami, the kami transfers to the buyer and the listing becomes stale. The listing's `fillListing` check will fail because the kami is no longer in `"LISTED"` state.

Direct ERC-721 transfer of a listed kami is blocked by `Kami721.isOutOfWorld` because `"LISTED"` is treated as in-world.

Stale listings remain `ACTIVE` and count toward the seller's order limit. The seller can cancel them to free the slot.

---

## Entity Model

Each order is an ECS entity with the following components:

| Component | Listing (`KAMI_LISTING`) | Offer (`KAMI_OFFER`) | Collection Offer (`KAMI_COLLECTION_OFFER`) |
|-----------|--------------------------|----------------------|--------------------------------------------|
| **EntityType** | `"KAMI_LISTING"` | `"KAMI_OFFER"` | `"KAMI_COLLECTION_OFFER"` |
| **State** | `ACTIVE` / `FILLED` / `CANCELLED` | `ACTIVE` / `FILLED` / `CANCELLED` | `ACTIVE` / `FILLED` / `CANCELLED` |
| **IDOwnsKamiOrder** | seller account ID | buyer account ID | buyer account ID |
| **IndexKami** | kami token index | target kami index | _(not set)_ |
| **Value** | price in wei (ETH) | offer price in wei (WETH) | price per kami in wei (WETH) |
| **Balance** | _(not set)_ | _(not set)_ | remaining quantity (int32) |
| **Max** | _(not set)_ | _(not set)_ | original quantity |
| **TimeStart** | creation timestamp | creation timestamp | creation timestamp |
| **TimeEnd** | expiry (0 = never) | expiry (0 = never) | expiry (0 = never) |

When an order is filled or cancelled, indexed/queryable components (`IDOwnsKamiOrder`, `IndexKami`, `Value`, `TimeStart`, `TimeEnd`, `Balance`, `Max`) are removed. `EntityType` and `State` are preserved for historical record.

---

## Configuration

All configuration is stored via `LibConfig` (key-value store) and managed through `_KamiMarketRegistrySystem` (admin-only):

| Config Key | Type | Description | Example |
|------------|------|-------------|---------|
| `KAMI_MARKET_ENABLED` | `bool` | Global marketplace enable/disable | `true` |
| `KAMI_MARKET_FEE_RATE` | `uint32[8]` | Fee rate array: `[precision, numerator, ...]` | `[4, 250, 0, ...]` = 2.5% |
| `KAMI_MARKET_FEE_RECIPIENT` | `address` | Treasury address receiving all fees | `0x...` |
| `KAMI_MARKET_VAULT` | `address` | Deployed `KamiMarketVault` contract address | `0x...` |
| `MAX_KAMI_MARKET_ORDERS` | `uint256` | Max open orders per account | `50` |

---

## Contracts

### KamiMarketVault

**Path**: `src/tokens/KamiMarketVault.sol`

A persistent relay contract for WETH and Kami721 transfers — the OpenSea conduit equivalent. Buyers approve it for WETH, sellers approve it for Kami721 (`setApprovalForAll`). The vault address persists across system upgrades, so users only approve once.

```solidity
contract KamiMarketVault is Ownable {
    address public immutable WETH;
    Kami721 public immutable KAMI721;
    mapping(address => bool) public authorizedCallers;

    function transferWETH(address from, address to, uint256 amount) external onlyAuthorized;
    function transferKami(address from, address to, uint256 tokenId) external onlyAuthorized;
    function authorizeCaller(address caller) external onlyOwner;
    function unauthorizeCaller(address caller) external onlyOwner;
}
```

- **`transferWETH`**: Calls `WETH.transferFrom(from, to, amount)` via `SafeTransferLib`. Only callable by authorized system addresses.
- **`transferKami`**: Calls `KAMI721.transferFrom(from, to, tokenId)` — standard ERC-721 transfer. Seller must have approved the vault.
- **`authorizeCaller`** / **`unauthorizeCaller`**: Owner manages which system addresses can call vault functions. Must be called after each system redeployment.

### IDOwnsKamiOrderComponent

**Path**: `src/components/IDOwnsKamiOrderComponent.sol`

A `Uint256Component` that maps order entity ID to the owner's account ID. Indexed for reverse lookups (querying all orders owned by an account).

```
ID = keccak256("component.id.kamiorder.owns")
```

### LibKamiMarket

**Path**: `src/libraries/LibKamiMarket.sol`

Contains all marketplace business logic, organized into sections:

#### Create Functions

| Function | Description |
|----------|-------------|
| `createListing(world, comps, accID, kamiIndex, price, expiry)` | Creates a `KAMI_LISTING` entity |
| `createOffer(world, comps, accID, kamiIndex, price, expiry)` | Creates a `KAMI_OFFER` entity |
| `createCollectionOffer(world, comps, accID, pricePerKami, quantity, expiry)` | Creates a `KAMI_COLLECTION_OFFER` entity with Balance/Max |

#### Fill Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `fillListing(comps, id, buyerAccID, buyerAddress)` | `(sellerAddress, price, kamiIndex)` | Verifies seller still owns kami, `vault.transferKami` to buyer, marks filled |
| `fillOffer(comps, id, sellerAccID, sellerAddress)` | `(buyerAddress, price, kamiIndex)` | `vault.transferKami` to buyer, marks filled |
| `fillCollectionOffer(comps, id, sellerAccID, sellerAddress, kamiIndex)` | `(buyerAddress, price)` | `vault.transferKami` to buyer, decrements Balance. Marks filled when Balance reaches 0 |

#### Cancel Functions

| Function | Description |
|----------|-------------|
| `cancelListing(comps, id)` | Restores kami state to `721_EXTERNAL` (if still listed), marks cancelled. Safe for stale listings. |
| `cancelOffer(comps, id)` | Marks cancelled (no WETH was ever escrowed) |

#### Verification Functions

| Function | Reverts if... |
|----------|---------------|
| `verifyEnabled(comps)` | Marketplace is disabled |
| `verifyActive(comps, id)` | Order state is not `ACTIVE` |
| `verifyNotExpired(comps, id)` | `block.timestamp > TimeEnd` (ignores if no expiry) |
| `verifyOwner(comps, id, accID)` | Caller is not the order owner |
| `verifyNotOwner(comps, id, accID)` | Caller IS the order owner (prevents self-trade) |
| `verifyMaxOrders(comps, accID)` | Account has reached max open orders |
| `verifyKamiExternal(comps, kamiIndex)` | Kami is not in `721_EXTERNAL` state |
| `verifyKamiExternalOrListed(comps, kamiIndex)` | Kami is not in `721_EXTERNAL` or `LISTED` state |
| `verifyKamiOwner(comps, kamiIndex, owner)` | Caller doesn't own the kami (via Kami721) |
| `verifyIsType(comps, id, type_)` | Entity type doesn't match expected type |

#### Getters

| Function | Returns |
|----------|---------|
| `getOwner(comps, id)` | Owner account ID of an order |
| `getPrice(comps, id)` | Price (Value component) |
| `getKamiIndex(comps, id)` | Kami token index (IndexKami component) |
| `getNumOrders(comps, accID)` | Count of open orders for an account |
| `getVault(comps)` | `KamiMarketVault` contract instance |
| `getFeeRecipient(comps)` | Fee treasury address |

### Systems

#### KamiMarketListSystem

**ID**: `system.kamimarket.list`

Creates a listing. Sets the kami state to `"LISTED"` (no escrow — kami stays in seller's wallet).

```solidity
function executeTyped(uint32 kamiIndex, uint256 price, uint256 expiry) public returns (bytes memory);
```

| Param | Type | Description |
|-------|------|-------------|
| `kamiIndex` | `uint32` | Kami token index to list |
| `price` | `uint256` | Listing price in wei (ETH) |
| `expiry` | `uint256` | Expiry timestamp, or `0` for no expiry |

**Returns**: `abi.encode(orderEntityID)`

**Preconditions**: Marketplace enabled, max orders not exceeded, kami is `721_EXTERNAL`, caller owns the kami, price > 0.

---

#### KamiMarketBuySystem

**ID**: `system.kamimarket.buy`

Buys one or more listings with ETH. All-or-nothing batch semantics. Refunds excess ETH.

```solidity
function executeTyped(uint256[] memory listingIDs) public payable returns (bytes memory);
```

| Param | Type | Description |
|-------|------|-------------|
| `listingIDs` | `uint256[]` | Array of listing entity IDs to buy |

**Payable**: Buyer must send `msg.value >= totalPrice`. Excess is refunded.

**Two-pass execution**: First pass verifies all listings (active, not expired, not self-trade) and accumulates total price. Checks `msg.value >= totalPrice`. Second pass fills each listing (kami to buyer), sends `price - fee` ETH to seller. Total fees sent to treasury at the end.

---

#### KamiMarketOfferSystem

**ID**: `system.kamimarket.offer`

Creates a specific offer for a kami, or a collection offer for any kami.

```solidity
// Specific offer
function executeTypedOffer(uint32 kamiIndex, uint256 price, uint256 expiry) public returns (bytes memory);

// Collection offer
function executeTypedCollection(uint256 price, uint32 quantity, uint256 expiry) public returns (bytes memory);
```

**Specific offer params**:

| Param | Type | Description |
|-------|------|-------------|
| `kamiIndex` | `uint32` | Target kami token index |
| `price` | `uint256` | Offer price in wei (WETH) |
| `expiry` | `uint256` | Expiry timestamp, or `0` for no expiry |

**Collection offer params**:

| Param | Type | Description |
|-------|------|-------------|
| `price` | `uint256` | Price per kami in wei (WETH) |
| `quantity` | `uint32` | Number of kamis to buy |
| `expiry` | `uint256` | Expiry timestamp, or `0` for no expiry |

**Returns**: `abi.encode(orderEntityID)`

**No WETH is transferred**. The buyer must have previously approved the `KamiMarketVault` for sufficient WETH. The actual transfer happens when a seller accepts.

---

#### KamiMarketAcceptOfferSystem

**ID**: `system.kamimarket.acceptoffer`

Accepts a specific offer or a collection offer. The vault pulls WETH from the buyer and the kami is transferred to the buyer.

```solidity
function executeTyped(uint256 offerID, uint32 kamiIndex) public returns (bytes memory);
```

| Param | Type | Description |
|-------|------|-------------|
| `offerID` | `uint256` | Offer entity ID to accept |
| `kamiIndex` | `uint32` | Kami token index to sell. Must match for specific offers; seller's choice for collection offers. |

**Preconditions**: Marketplace enabled, offer active and not expired, caller is not the offer owner (no self-trade), kami is `721_EXTERNAL` or `LISTED`, caller owns the kami. If the kami is listed, its state is restored to `721_EXTERNAL` before transfer (the listing becomes stale).

**For specific offers**: Verifies the offer's target kami matches `kamiIndex`.

**For collection offers**: Decrements the offer's Balance. When Balance reaches 0, the offer is marked `FILLED`.

**WETH flow**: `vault.transferWETH(buyer, seller, price - fee)` + `vault.transferWETH(buyer, treasury, fee)`.

---

#### KamiMarketCancelSystem

**ID**: `system.kamimarket.cancel`

Cancels any order. For listings, restores kami state to `721_EXTERNAL` (no token movement since kami was never escrowed). For offers, just marks cancelled (WETH was never escrowed).

```solidity
// User cancel (own orders only)
function executeTyped(uint256 id) public returns (bytes memory);

// Admin cancel (any orders, batch)
function executeAdmin(uint256[] memory ids) public;
```

| Param | Type | Description |
|-------|------|-------------|
| `id` / `ids` | `uint256` / `uint256[]` | Order entity ID(s) to cancel |

**User cancel**: Verifies caller is the order owner and order is `ACTIVE`.

**Admin cancel**: Requires `onlyAdmin` role. Can cancel any active order. Supports batch cancellation.

---

#### _KamiMarketRegistrySystem

**ID**: `system.kamimarket.registry`

Admin-only system for marketplace configuration.

```solidity
function setFeeRate(uint32[8] memory rate) public onlyAdmin;
function setFeeRecipient(address recipient) public onlyAdmin;
function setMaxOrders(uint256 max) public onlyAdmin;
function setVault(address vault) public onlyAdmin;
function setEnabled(bool enabled) public onlyAdmin;
```

---

## Flows

### List a Kami

```
Seller                    KamiMarketListSystem                                   ECS
  |                              |                                               |
  |-- executeTyped(idx,price) -->|                                               |
  |                              |-- verify checks (external, owner, maxOrders)->|
  |                              |-- LibKami.setState("LISTED") ---------------->|
  |                              |   (no token movement — kami stays in wallet)  |
  |                              |-- createListing() --------------------------->|
  |                              |-- emitList() -------------------------------->|
  |<--- abi.encode(orderID) -----|                                               |
```

### Buy Listings (Batch, ETH)

```
Buyer                     KamiMarketBuySystem                Vault            Seller
  |                              |                            |                  |
  |-- executeTyped{value}([]) -->|                            |                  |
  |                              |-- for each listing:        |                  |
  |                              |   verify active/expiry     |                  |
  |                              |   fillListing():           |                  |
  |                              |     verify seller owns kami|                  |
  |                              |     setState("721_EXTERNAL")                  |
  |                              |     vault.transferKami() ->|-- transferFrom ->|
  |                              |   ETH transfer ------------|----------------->|
  |                              |-- fee to treasury          |                  |
  |                              |-- refund excess ETH ------>|                  |
  |<--- return ------------------|                            |                  |
```

### Create Offer (Specific)

```
Buyer                     KamiMarketOfferSystem              ECS
  |                              |                            |
  |  (must approve vault first)  |                            |
  |-- executeTypedOffer() ------>|                            |
  |                              |-- verify checks --------->|
  |                              |-- createOffer() --------->|
  |                              |   (no WETH transferred)   |
  |<--- abi.encode(orderID) -----|                            |
```

### Create Collection Offer

```
Buyer                     KamiMarketOfferSystem              ECS
  |                              |                            |
  |  (must approve vault first)  |                            |
  |-- executeTypedCollection() ->|                            |
  |                              |-- verify checks --------->|
  |                              |-- createCollectionOffer()->|
  |                              |   Balance=qty, Max=qty    |
  |<--- abi.encode(orderID) -----|                            |
```

### Accept Offer

```
Seller                    KamiMarketAcceptOfferSystem        Vault             Buyer
  |                              |                            |                  |
  |-- executeTyped(offerID,idx)->|                            |                  |
  |                              |-- verify checks            |                  |
  |                              |-- fillOffer()              |                  |
  |                              |   vault.transferKami() --->|-- Kami721 ------>|
  |                              |                            |                  |
  |                              |-- vault.transferWETH() --->|-- WETH --------->|
  |                              |   (buyer -> seller - fee)  |                  |
  |                              |-- vault.transferWETH() --->|-- fee to treasury|
  |<--- return ------------------|                            |                  |
```

### Cancel Order

```
Owner                     KamiMarketCancelSystem                                ECS
  |                              |                                               |
  |-- executeTyped(orderID) ---->|                                               |
  |                              |-- verify owner + active                       |
  |                              |                                               |
  |  [if KAMI_LISTING]:          |                                               |
  |                              |-- cancelListing() --------------------------->|
  |                              |   setState("721_EXTERNAL"), mark CANCELLED    |
  |                              |   (no token movement — kami already in wallet)|
  |                              |                                               |
  |  [if KAMI_OFFER / COLLECTION]:                                               |
  |                              |-- cancelOffer() ---------------------------->|
  |                              |   (mark CANCELLED only)                      |
  |                              |                                               |
  |<--- return ------------------|                                               |
```

### Admin Cancel

```
Admin                     KamiMarketCancelSystem                                ECS
  |                              |                                               |
  |-- executeAdmin([ids]) ------>|                                               |
  |                              |-- for each: verify active                     |
  |                              |-- _cancel() per order --->  (same as above)   |
  |<--- return ------------------|                                               |
```

---

## Fee Model

Fees are deducted from the seller's proceeds. The buyer always pays the listed/offered price.

```
fee = price * numerator / 10^precision
sellerReceives = price - fee
```

Configuration example for 2.5% fee:
```
KAMI_MARKET_FEE_RATE = [4, 250, 0, 0, 0, 0, 0, 0]
// fee = price * 250 / 10^4 = price * 0.025
```

- **Listings (ETH)**: Fee is accumulated across all listings in a batch buy and sent to the treasury in a single transfer at the end.
- **Offers (WETH)**: Fee is pulled from the buyer's WETH balance as a separate `vault.transferWETH` call.

---

## Events

Events are emitted via `LibEmitter.emitEvent` with structured schemas:

| Event Name | Fields | Emitted By |
|------------|--------|------------|
| `KAMI_MARKET_LIST` | `(orderID: uint256, accID: uint256, kamiIndex: uint32, price: uint256)` | `KamiMarketListSystem` |
| `KAMI_MARKET_BUY` | `(orderID: uint256, buyerAccID: uint256, sellerAccID: uint256, kamiIndex: uint32, price: uint256)` | `KamiMarketBuySystem` |
| `KAMI_MARKET_OFFER` | `(orderID: uint256, accID: uint256, price: uint256)` | `KamiMarketOfferSystem` |
| `KAMI_MARKET_ACCEPT` | `(orderID: uint256, sellerAccID: uint256, buyerAccID: uint256, kamiIndex: uint32, price: uint256)` | `KamiMarketAcceptOfferSystem` |
| `KAMI_MARKET_CANCEL` | `(orderID: uint256, accID: uint256)` | `KamiMarketCancelSystem` |

---

## Data Logging

Per-account activity counters are incremented via `LibData.inc`:

| Key | Incremented When |
|-----|------------------|
| `KAMI_MARKET_LIST` | Seller creates a listing |
| `KAMI_MARKET_BUY` | Buyer purchases a listing |
| `KAMI_MARKET_OFFER` | Buyer creates an offer or collection offer |
| `KAMI_MARKET_ACCEPT` | Seller accepts an offer |
| `KAMI_MARKET_CANCEL` | Owner cancels an order |

---

## Client Integration

### System IDs

```typescript
{
  KamiMarketListSystem: "system.kamimarket.list",
  KamiMarketBuySystem: "system.kamimarket.buy",
  KamiMarketOfferSystem: "system.kamimarket.offer",
  KamiMarketAcceptOfferSystem: "system.kamimarket.acceptoffer",
  KamiMarketCancelSystem: "system.kamimarket.cancel",
  _KamiMarketRegistrySystem: "system.kamimarket.registry",
}
```

### Component

```typescript
IDOwnsKamiOrder: "component.id.kamiorder.owns"  // Uint256, indexed
```

### Approvals

Both sellers and buyers approve the `KamiMarketVault` (persistent address, survives system upgrades):

```typescript
const vaultAddress = /* from config: KAMI_MARKET_VAULT */;

// Sellers: approve vault to transfer Kami721 tokens (for listings + accepting offers)
await kami721Contract.setApprovalForAll(vaultAddress, true);

// Buyers: approve vault to spend WETH (for offers)
await wethContract.approve(vaultAddress, ethers.MaxUint256);
```

The vault address can be read from config: `LibConfig.getAddress("KAMI_MARKET_VAULT")`.

### Querying Open Orders

Open orders can be found by querying entities with:
- `State == "ACTIVE"`
- `EntityType == "KAMI_LISTING"` / `"KAMI_OFFER"` / `"KAMI_COLLECTION_OFFER"`

Per-account orders can be queried via the indexed `IDOwnsKamiOrder` component using the account ID as the index value.

### Stale Orders

**Stale listings**: Since listings have no escrow, a listing can become unfillable if the seller transfers the kami away or bridges it back in-game. The buy transaction will revert. Clients should verify the seller still owns the kami before displaying the listing.

**Stale offers**: Since offers are approval-based (no WETH escrow), an offer can become unfillable if the buyer spends their WETH or revokes approval. The `acceptOffer` transaction will revert. Clients should display balance/allowance warnings for stale offers.

---

## Security Considerations

- **Self-trade prevention**: `verifyNotOwner` prevents buying your own listing or accepting your own offer.
- **Expiry enforcement**: `verifyNotExpired` checked on all buy/accept operations. Creating with `expiry = 0` means no expiry.
- **Order limit**: `verifyMaxOrders` prevents spamming. Configurable via `MAX_KAMI_MARKET_ORDERS`.
- **Kami state gating**: Only kamis in `721_EXTERNAL` state can be listed. Offers can be accepted for kamis in `721_EXTERNAL` or `LISTED` state (accepting an offer for a listed kami makes the listing stale). In-game kamis cannot enter the marketplace. Listed kamis cannot be bridged in-game because `isInWorld()` returns `true` for non-`721_EXTERNAL` states.
- **Seller ownership verification**: At buy time, `fillListing` verifies the seller still owns the kami. If the kami was transferred away, the purchase reverts cleanly.
- **No escrow risk on listings**: Kamis stay in the seller's wallet. If the seller transfers the kami externally, the listing becomes stale — a buyer attempting to purchase gets a revert, not a loss of funds.
- **ETH refund**: Excess `msg.value` on batch buys is refunded to the buyer.
- **No WETH escrow risk**: Offers can become stale. The vault's `transferFrom` will revert if the buyer lacks balance or allowance, keeping the seller's kami safe.
- **Vault authorization**: Only authorized system addresses can call `transferWETH`. The vault owner must update authorized callers after each system redeployment.
- **Admin override**: Admins can cancel any active order via `executeAdmin`, useful for emergency situations or invalid listings.
- **Global kill switch**: `KAMI_MARKET_ENABLED` can disable all marketplace operations instantly.

---

## File Map

```
packages/contracts/
  src/
    components/
      IDOwnsKamiOrderComponent.sol    # Order ownership component (Uint256, indexed)
    tokens/
      KamiMarketVault.sol             # Persistent WETH transfer relay
    libraries/
      LibKamiMarket.sol               # All marketplace business logic
    systems/
      KamiMarketListSystem.sol        # Create listings (no escrow, kami stays in wallet)
      KamiMarketBuySystem.sol         # Buy listings with ETH (batch, payable)
      KamiMarketOfferSystem.sol       # Create specific/collection offers (WETH)
      KamiMarketAcceptOfferSystem.sol # Accept offers (vault pulls WETH)
      KamiMarketCancelSystem.sol      # Cancel orders + admin cancel
      _KamiMarketRegistrySystem.sol   # Admin configuration
  test/
    systems/
      KamiMarket.t.sol                # Test suite (26 tests)
```
