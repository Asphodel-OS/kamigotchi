# Kamigotchi

A Web3 blockchain game built as a monorepo with a React client and Solidity smart contracts using the Entity Component System (ECS) pattern.

## Quick Reference

| Item | Value |
|------|-------|
| **License** | AGPL-3.0-only |
| **Node** | >=22.0.0 |
| **Package Manager** | pnpm@10.13.1 |
| **Solidity** | 0.8.28 |
| **React** | 19.2.0 |
| **Framework (contracts)** | Foundry + MUD-classic SOLECS |
| **Framework (client)** | Vite 5 + Custom ECS |

## Repository Structure

```
kamigotchi/
├── packages/
│   ├── client/          # React frontend (Vite, TypeScript)
│   └── contracts/       # Solidity smart contracts (Foundry)
├── .claude/
│   └── rules/           # AI agent rules (comments, documenting)
├── patches/             # pnpm patch dependencies
├── static/              # Static assets
└── package.json         # Root workspace config
```

## Essential Commands

### Root Level
```bash
pnpm dev              # Run all: anvil node + client dev + contracts dev
pnpm build            # Build contracts then client
pnpm nuke             # Clean rebuild (delete all artifacts)
```

### Client (`packages/client`)
```bash
pnpm dev:puter        # Local dev with local chain
pnpm dev:test         # Dev against testing environment
pnpm dev:prod         # Dev against production
pnpm build            # Production build
pnpm lint             # ESLint fix
pnpm prettier:fix     # Format code
```

### Contracts (`packages/contracts`)
```bash
pnpm build            # Full build (systems + codegen + ABI)
pnpm test             # Run Forge tests
pnpm dev              # Local chain + deploy
pnpm deploy:local     # Deploy to local anvil
pnpm deploy:test      # Deploy to testing
pnpm deploy:prod      # Deploy to production
pnpm lint             # Solhint fix
pnpm format           # Prettier for Solidity
```

## Architecture Overview

### Entity Component System (ECS)

Both client and contracts use ECS architecture where:
- **Entities** are unique IDs (uint256 on-chain, strings in client)
- **Components** store data keyed by entity ID
- **Systems** contain logic that reads/writes components

This pattern enables modular game development where new features can be added without modifying existing code.

### Client Architecture

```
src/
├── app/               # React UI layer
│   ├── root/          # Root component, context providers
│   │   └── components/# Root-level components (MainWindow.tsx)
│   ├── stores/        # Zustand stores (account, network, selected)
│   ├── cache/         # ECS component caches by domain
│   ├── components/    # UI components
│   │   ├── modals/    # 27 modal dialogs
│   │   ├── fixtures/  # Persistent UI elements
│   │   └── validators/# Auth/wallet validators
│   └── triggers/      # Modal trigger functions
├── cache/             # Generic IndexedDB caching utilities
├── engine/            # Custom ECS implementation
│   ├── recs/          # Core ECS (World, Component, Query)
│   ├── executors/     # Transaction execution
│   └── queue/         # Transaction queue
├── network/           # Blockchain integration
│   ├── components/    # ECS component definitions
│   ├── shapes/        # Domain-specific utilities (34 domains)
│   ├── systems/       # Game systems (ActionSystem, etc.)
│   ├── setup/         # MUD network initialization
│   └── api/           # Player action API
├── constants/         # Game constants (items, rooms, dialogue)
├── clients/           # External clients (Privy, Wagmi, gRPC)
├── utils/             # Utility functions
└── workers/           # Web Workers for background sync
```
<!-- REVIEWED: Changed "26 modal dialogs" to "27 modal dialogs" -->
<!-- REVIEWED: Added "cache/" at src level for IndexedDB utilities to distinguish from app/cache -->

**State Management Layers:**
1. **ECS (engine/recs)** - Source of truth, reactive RxJS streams
2. **Zustand stores** - UI state (account, network, selected entities)
3. **Component caches (app/cache)** - Domain-specific query helpers

**Key Entry Points:**
- `src/index.ts` -> `src/boot.ts` -> initializes React and ECS
- `app/root/Root.tsx` - Main React component with providers
- `network/create.ts` - Creates network layer with ECS world

### Contracts Architecture

```
src/
├── solecs/            # ECS framework (World, Component, System)
├── components/        # 92 game components
├── systems/           # 77 game systems
├── libraries/         # 62 shared logic libraries (44 core + 18 utils)
├── tokens/            # ERC20/ERC721 (OpenMintable, Kami721 NFT)
└── utils/             # Solidity utilities

deployment/
├── commands/          # Deployment scripts (ts-node)
├── contracts/         # Generated deploy contracts
└── world/             # World configuration
```
<!-- REVIEWED: Changed "93 game components" to "92 game components" -->
<!-- REVIEWED: Changed "79 game systems" to "77 game systems" -->
<!-- REVIEWED: Changed "45 shared logic libraries" to "62 shared logic libraries (44 core + 18 utils)" -->
<!-- REVIEWED: Changed "ERC721 (Kami721 NFT)" to "ERC20/ERC721 (OpenMintable, Kami721 NFT)" -->

**Component Categories:**
- Identity: `AddressOwnerComponent`, `NameComponent`, `IndexAccountComponent`
- Stats: `HealthComponent`, `StaminaComponent`, `ExperienceComponent`, `LevelComponent`
- Relationships: `IDOwnsKamiComponent`, `IDOwnsInventoryComponent`
- Temporal: `TimeLastActionComponent`, `TimeStartComponent`, `TimeEndComponent`

**System Categories:**
- Account: `AccountRegisterSystem`, `AccountMoveSystem`, `AccountUseItemSystem`
- Game: `CraftSystem`, `HarvestStartSystem`, `AuctionBuySystem`, `GachaBuyTicketSystem`
- Social: `FriendRequestSystem`, `FriendAcceptSystem`, `ChatSystem`
- Registry (admin): `_ItemRegistrySystem`, `_QuestRegistrySystem`, `_RoomRegistrySystem`

## Path Aliases (Client)

```typescript
import { ... } from 'abi/...';       // ./abi
import { ... } from 'types/...';     // ./types
import { ... } from 'src/...';       // ./src
import { ... } from 'app/...';       // ./src/app
import { ... } from 'assets/...';    // ./src/assets
import { ... } from 'engine/...';    // ./src/engine
import { ... } from 'network/...';   // ./src/network
import { ... } from 'constants/...'; // ./src/constants
import { ... } from 'utils/...';     // ./src/utils
import { ... } from 'workers/...';   // ./src/workers
import { ... } from 'cache/...';     // ./src/cache (IndexedDB utilities)
import { ... } from 'clients/...';   // ./src/clients
```
<!-- REVIEWED: Added 'src' and 'assets' aliases which were missing -->

## Environment Configuration

| File | Purpose |
|------|---------|
| `.env.puter` | Local development (anvil chain) |
| `.env.testing` | Testing environment |
| `.env.production` | Production (mainnet) |

Key variables: `VITE_PRIVY_APP_ID`, `VITE_PRIVY_CLIENT_ID`, chain/RPC configs.

## Testing

### Contracts
```bash
pnpm test    # Runs Forge tests with gas reports
```
Test files in `packages/contracts/test/` with 56+ test files covering systems, libraries, and integrations.

### Client
No automated tests configured. Linting and type checking available via:
```bash
pnpm lint
pnpm prettier
```

## Code Conventions

### TypeScript/JavaScript
- Self-documenting code; avoid redundant comments
- Delete commented-out code
- Use path aliases for imports
- React 19 patterns with functional components
- Zustand for global UI state
- RxJS for reactive streams in ECS

### Solidity
- Foundry for compilation and testing
- OpenZeppelin contracts for token standards
- Solady for gas-optimized utilities
- Systems must be granted write access to specific components
- Entity IDs are uint256 with semantic prefixes

### Documentation
- Generate docs in `packages/client/temp/` or `packages/contracts/temp/`
- Name files with numeric prefix: `001_NAME.md`, `002_NAME.md`
- Include date at bottom of each document

## Key Technologies

### Client
- **React 19** + **Vite 5** - UI framework and bundler
- **Wagmi/Viem** - Ethereum client
- **Privy** - Wallet authentication
- **Three.js** - 3D graphics
- **Zustand** - State management
- **MobX** - Reactive state
- **RxJS** - Reactive streams for ECS
- **gRPC/Protobuf** - Network communication

### Contracts
- **Foundry** - Development framework
- **MUD-classic SOLECS** - ECS pattern
- **OpenZeppelin** - Token standards (ERC721, ERC2981)
- **ERC721A** - Optimized NFT minting
- **Solady/Solmate** - Gas-optimized libraries

## Common Workflows

### Adding a New System (Contracts)
1. Create system in `src/systems/NewSystem.sol`
2. Add entry to `deploy.json` with component write permissions
3. Run `pnpm build:codegen` to regenerate imports
4. Add tests in `test/systems/`
5. Deploy with `pnpm deploy:*`

### Adding a New Component (Contracts)
1. Create component in `src/components/NewComponent.sol`
2. Add entry to `deploy.json`
3. Run `pnpm build:codegen`
4. Register in client `network/components/register.ts`
5. Add cache helpers in `app/cache/<domain>/`

### Adding a New Modal (Client)
1. Create component in `app/components/modals/`
2. Add trigger in `app/triggers/`
3. Register visibility in `app/stores/visibility.ts`
4. Add to `app/root/components/MainWindow.tsx` grid

## File Locations

| What | Where |
|------|-------|
| ABI files | `packages/client/abi/` |
| TypeScript contract types | `packages/client/types/ethers-contracts/` |
| Component ID mappings | `packages/contracts/componentIDs.json` |
| System ID mappings | `packages/contracts/systemIDs.json` |
| Deploy config | `packages/contracts/deploy.json` |
| ECS core | `packages/client/src/engine/recs/` |
| Network layer | `packages/client/src/network/` |
| React components | `packages/client/src/app/components/` |
| Zustand stores | `packages/client/src/app/stores/` |
| Game constants | `packages/client/src/constants/` |
| Solidity components | `packages/contracts/src/components/` |
| Solidity systems | `packages/contracts/src/systems/` |
| Solidity libraries | `packages/contracts/src/libraries/` |

## Debugging

### Client
```javascript
// Available on window in dev mode
window.network  // Network layer with ECS world
window.ecs      // ECS utilities (setComponent, removeComponent, getComponentValue)
```

### Contracts
```bash
forge test -vvvv    # Verbose test output
forge debug         # Step-through debugger
```

## Important Notes

- **Never commit secrets** - Use environment variables
- **ECS is source of truth** - Client state derives from on-chain components
- **Systems have explicit permissions** - Each system can only write to designated components
- **Multisig for production** - Protected components require multisig approval
- **Web Workers for sync** - Background state synchronization to avoid blocking UI
