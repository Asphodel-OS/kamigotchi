```
8 8888     ,88'          .8.                   ,8.       ,8.           8 8888      ,o888888o.        ,o888888o.     8888888 8888888888     ,o888888o.    8 8888        8  8 8888
8 8888    ,88'          .888.                 ,888.     ,888.          8 8888     8888     `88.   . 8888     `88.         8 8888          8888     `88.  8 8888        8  8 8888
8 8888   ,88'          :88888.               .`8888.   .`8888.         8 8888  ,8 8888       `8. ,8 8888       `8b        8 8888       ,8 8888       `8. 8 8888        8  8 8888
8 8888  ,88'          . `88888.             ,8.`8888. ,8.`8888.        8 8888  88 8888           88 8888        `8b       8 8888       88 8888           8 8888        8  8 8888
8 8888 ,88'          .8. `88888.           ,8'8.`8888,8^8.`8888.       8 8888  88 8888           88 8888         88       8 8888       88 8888           8 8888        8  8 8888
8 8888 88'          .8`8. `88888.         ,8' `8.`8888' `8.`8888.      8 8888  88 8888           88 8888         88       8 8888       88 8888           8 8888        8  8 8888
8 888888<          .8' `8. `88888.       ,8'   `8.`88'   `8.`8888.     8 8888  88 8888   8888888 88 8888        ,8P       8 8888       88 8888           8 8888888888888  8 8888
8 8888 `Y8.       .8'   `8. `88888.     ,8'     `8.`'     `8.`8888.    8 8888  `8 8888       .8' `8 8888       ,8P        8 8888       `8 8888       .8' 8 8888        8  8 8888
8 8888   `Y8.    .888888888. `88888.   ,8'       `8        `8.`8888.   8 8888     8888     ,88'   ` 8888     ,88'         8 8888          8888     ,88'  8 8888        8  8 8888
8 8888     `Y8. .8'       `8. `88888. ,8'         `         `8.`8888.  8 8888      `8888888P'        `8888888P'           8 8888           `8888888P'    8 8888        8  8 8888
```

![Screen Shot 2023-10-06 at 6 22 13 PM (2)](https://github.com/Asphodel-OS/kamigotchi/assets/109483360/a2fc7839-5ded-48df-8c15-248374b19ff1)

```
8 8888     ,88'          .8.                   ,8.       ,8.           8 8888      ,o888888o.        ,o888888o.     8888888 8888888888     ,o888888o.    8 8888        8  8 8888
8 8888    ,88'          .888.                 ,888.     ,888.          8 8888     8888     `88.   . 8888     `88.         8 8888          8888     `88.  8 8888        8  8 8888
8 8888   ,88'          :88888.               .`8888.   .`8888.         8 8888  ,8 8888       `8. ,8 8888       `8b        8 8888       ,8 8888       `8. 8 8888        8  8 8888
8 8888  ,88'          . `88888.             ,8.`8888. ,8.`8888.        8 8888  88 8888           88 8888        `8b       8 8888       88 8888           8 8888        8  8 8888
8 8888 ,88'          .8. `88888.           ,8'8.`8888,8^8.`8888.       8 8888  88 8888           88 8888         88       8 8888       88 8888           8 8888        8  8 8888
8 8888 88'          .8`8. `88888.         ,8' `8.`8888' `8.`8888.      8 8888  88 8888           88 8888         88       8 8888       88 8888           8 8888        8  8 8888
8 888888<          .8' `8. `88888.       ,8'   `8.`88'   `8.`8888.     8 8888  88 8888   8888888 88 8888        ,8P       8 8888       88 8888           8 8888888888888  8 8888
8 8888 `Y8.       .8'   `8. `88888.     ,8'     `8.`'     `8.`8888.    8 8888  `8 8888       .8' `8 8888       ,8P        8 8888       `8 8888       .8' 8 8888        8  8 8888
8 8888   `Y8.    .888888888. `88888.   ,8'       `8        `8.`8888.   8 8888     8888     ,88'   ` 8888     ,88'         8 8888          8888     ,88'  8 8888        8  8 8888
8 8888     `Y8. .8'       `8. `88888. ,8'         `         `8.`8888.  8 8888      `8888888P'        `8888888P'           8 8888           `8888888P'    8 8888        8  8 8888
```

<br>
<br>

_built with love, powered by \[redacted\]_

<br>
<br>

# Quick Start
<br>

_baby steps_

<br>

<img width="100%" alt="Screenshot" imageRendering="pixelated" src="https://github.com/user-attachments/assets/d52011c7-5d7b-432c-ac26-3abb064fe343" />

<br>
<br>

first we clone the repo
```sh
# with github cli
gh repo clone Asphodel-OS/kamigotchi

# rawdogging ssh with git
git clone git@github.com:Asphodel-OS/kamigotchi.git
```
<br>

then we install dependencies using [pnpm](https://pnpm.io/)
```sh
kamigotchi/$ pnpm i
```
<br>

## 🚀 Local Client (pointing to mainnet)

you can spin up a local game client with the following command

which will run a vite development server on localhost:3000 in _production_ mode
```sh
kamigotchi/packages/client/$ pnpm start:dev
```
<br>

you'll also want a `client/.env.production` file populated like so
```sh
# Network
VITE_CHAIN_ID=428962654539583

# Infra
VITE_KAMIGAZE_URL='https://api.prod.kamigotchi.io'

# World
VITE_WORLD_ADDRESS='0x2729174c265dbBd8416C6449E0E813E88f43D0E7'
VITE_INITIAL_BLOCK_NUMBER=44577
```
<br>

## 🚀 Local Deployment

_first you'll need to have [cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html) and [foundry](https://getfoundry.sh/introduction/installation) installed_

you'll also want the following environment files
```sh
# packages/contracts/.env.puter
RPC="http://127.0.0.1:8545"
WORLD="0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f"
PRIV_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
```

```sh
# packages/client/.env.puter
VITE_CHAIN_ID=1337
VITE_RPC_TRANSPORT_URL='localhost:8545'
VITE_WORLD_ADDRESS='0x379FA7857b8722d2719f16f78753995BafEb4B9b'
PRIV_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
```
<br>
<br>
<br>

once you have everything, run the following script in a dedicated terminal window
```sh
kamigotchi/packages/contracts/$ pnpm start
```
<br>

you should see something like the below
<img width="100%" alt="Screenshot" src="https://github.com/user-attachments/assets/f8ea7545-b50c-477f-931c-fac6a5e75f0f" />


<br>
<br>
<br>

followed by ~1200 transactions (this is normal)

<br>
<br>
<br>

_do you see it ?_
- a local EVM Node generated in the `contracts/` window
- [MUD](https://mud.dev/) `Components` and `Systems` automagically deployed
- lots of transactions (data deployments)
- a spawned browser tab with the newly generated url parameters

<br>
<br>
<br>
  
<img width="100%" alt="Screenshot" src="https://github.com/user-attachments/assets/3bb9782d-9301-48ce-aa07-8483ce8cc923" />
<br>

_the void greets you_

<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>

_wonderful, now that we've rooted your computer_

_we can continue to setup_

<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>

_the game should now run so long as you_
- have a supported wallet manager installed (e.g. metamask, rabby)
- have exactly one wallet manager active

<br>

_you may need to use or transfer ETH from one of the pre-loaded wallets_
```
[node:local  ] Private Keys
[node:local  ] ==================
[node:local  ]
[node:local  ] (0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
[node:local  ] (1) 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
[node:local  ] (2) 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
[node:local  ] (3) 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
[node:local  ] (4) 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
[node:local  ] (5) 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
[node:local  ] (6) 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e
[node:local  ] (7) 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356
[node:local  ] (8) 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97
[node:local  ] (9) 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6
```

<br>

_now, for the fun part: choose a name for your account_
  
<img width="100%" alt="Screenshot" src="https://github.com/user-attachments/assets/56cec91b-5a2c-44a6-9ac0-ffd87cb6e30a" />

<br>

_listen to the voices_

<br>

![Screen Shot 2023-10-06 at 6 19 56 PM (2)](https://github.com/Asphodel-OS/kamigotchi/assets/109483360/93dd98a5-3b39-476b-a511-75d771deb6fe)

<br>

_they're right you know_

<br>

![Screen Shot 2023-10-06 at 6 21 03 PM (2)](https://github.com/Asphodel-OS/kamigotchi/assets/109483360/3d104a18-4019-4c48-8f82-f698b4425e14)

<br>

_the intrusive thoughts should win_

<br>

# Environments

- local [`.env.puter`]
- testing [`.env.testing`]
- production [`.env.production`]


```
8 8888     ,88'          .8.                   ,8.       ,8.           8 8888      ,o888888o.        ,o888888o.     8888888 8888888888     ,o888888o.    8 8888        8  8 8888
8 8888    ,88'          .888.                 ,888.     ,888.          8 8888     8888     `88.   . 8888     `88.         8 8888          8888     `88.  8 8888        8  8 8888
8 8888   ,88'          :88888.               .`8888.   .`8888.         8 8888  ,8 8888       `8. ,8 8888       `8b        8 8888       ,8 8888       `8. 8 8888        8  8 8888
8 8888  ,88'          . `88888.             ,8.`8888. ,8.`8888.        8 8888  88 8888           88 8888        `8b       8 8888       88 8888           8 8888        8  8 8888
8 8888 ,88'          .8. `88888.           ,8'8.`8888,8^8.`8888.       8 8888  88 8888           88 8888         88       8 8888       88 8888           8 8888        8  8 8888
8 8888 88'          .8`8. `88888.         ,8' `8.`8888' `8.`8888.      8 8888  88 8888           88 8888         88       8 8888       88 8888           8 8888        8  8 8888
8 888888<          .8' `8. `88888.       ,8'   `8.`88'   `8.`8888.     8 8888  88 8888   8888888 88 8888        ,8P       8 8888       88 8888           8 8888888888888  8 8888
8 8888 `Y8.       .8'   `8. `88888.     ,8'     `8.`'     `8.`8888.    8 8888  `8 8888       .8' `8 8888       ,8P        8 8888       `8 8888       .8' 8 8888        8  8 8888
8 8888   `Y8.    .888888888. `88888.   ,8'       `8        `8.`8888.   8 8888     8888     ,88'   ` 8888     ,88'         8 8888          8888     ,88'  8 8888        8  8 8888
8 8888     `Y8. .8'       `8. `88888. ,8'         `         `8.`8888.  8 8888      `8888888P'        `8888888P'           8 8888           `8888888P'    8 8888        8  8 8888
```

```
8 8888     ,88'          .8.                   ,8.       ,8.           8 8888      ,o888888o.        ,o888888o.     8888888 8888888888     ,o888888o.    8 8888        8  8 8888
8 8888    ,88'          .888.                 ,888.     ,888.          8 8888     8888     `88.   . 8888     `88.         8 8888          8888     `88.  8 8888        8  8 8888
8 8888   ,88'          :88888.               .`8888.   .`8888.         8 8888  ,8 8888       `8. ,8 8888       `8b        8 8888       ,8 8888       `8. 8 8888        8  8 8888
8 8888  ,88'          . `88888.             ,8.`8888. ,8.`8888.        8 8888  88 8888           88 8888        `8b       8 8888       88 8888           8 8888        8  8 8888
8 8888 ,88'          .8. `88888.           ,8'8.`8888,8^8.`8888.       8 8888  88 8888           88 8888         88       8 8888       88 8888           8 8888        8  8 8888
8 8888 88'          .8`8. `88888.         ,8' `8.`8888' `8.`8888.      8 8888  88 8888           88 8888         88       8 8888       88 8888           8 8888        8  8 8888
8 888888<          .8' `8. `88888.       ,8'   `8.`88'   `8.`8888.     8 8888  88 8888   8888888 88 8888        ,8P       8 8888       88 8888           8 8888888888888  8 8888
8 8888 `Y8.       .8'   `8. `88888.     ,8'     `8.`'     `8.`8888.    8 8888  `8 8888       .8' `8 8888       ,8P        8 8888       `8 8888       .8' 8 8888        8  8 8888
8 8888   `Y8.    .888888888. `88888.   ,8'       `8        `8.`8888.   8 8888     8888     ,88'   ` 8888     ,88'         8 8888          8888     ,88'  8 8888        8  8 8888
8 8888     `Y8. .8'       `8. `88888. ,8'         `         `8.`8888.  8 8888      `8888888P'        `8888888P'           8 8888           `8888888P'    8 8888        8  8 8888
```

<img width="100%" alt="Screenshot" imageRendering="pixelated" src="https://github.com/user-attachments/assets/b100ee16-d178-40ea-a2ea-5f98b06da13f" />

```
8 8888     ,88'          .8.                   ,8.       ,8.           8 8888      ,o888888o.        ,o888888o.     8888888 8888888888     ,o888888o.    8 8888        8  8 8888
8 8888    ,88'          .888.                 ,888.     ,888.          8 8888     8888     `88.   . 8888     `88.         8 8888          8888     `88.  8 8888        8  8 8888
8 8888   ,88'          :88888.               .`8888.   .`8888.         8 8888  ,8 8888       `8. ,8 8888       `8b        8 8888       ,8 8888       `8. 8 8888        8  8 8888
8 8888  ,88'          . `88888.             ,8.`8888. ,8.`8888.        8 8888  88 8888           88 8888        `8b       8 8888       88 8888           8 8888        8  8 8888
8 8888 ,88'          .8. `88888.           ,8'8.`8888,8^8.`8888.       8 8888  88 8888           88 8888         88       8 8888       88 8888           8 8888        8  8 8888
8 8888 88'          .8`8. `88888.         ,8' `8.`8888' `8.`8888.      8 8888  88 8888           88 8888         88       8 8888       88 8888           8 8888        8  8 8888
8 888888<          .8' `8. `88888.       ,8'   `8.`88'   `8.`8888.     8 8888  88 8888   8888888 88 8888        ,8P       8 8888       88 8888           8 8888888888888  8 8888
8 8888 `Y8.       .8'   `8. `88888.     ,8'     `8.`'     `8.`8888.    8 8888  `8 8888       .8' `8 8888       ,8P        8 8888       `8 8888       .8' 8 8888        8  8 8888
8 8888   `Y8.    .888888888. `88888.   ,8'       `8        `8.`8888.   8 8888     8888     ,88'   ` 8888     ,88'         8 8888          8888     ,88'  8 8888        8  8 8888
8 8888     `Y8. .8'       `8. `88888. ,8'         `         `8.`8888.  8 8888      `8888888P'        `8888888P'           8 8888           `8888888P'    8 8888        8  8 8888
```

```
8 8888     ,88'          .8.                   ,8.       ,8.           8 8888      ,o888888o.        ,o888888o.     8888888 8888888888     ,o888888o.    8 8888        8  8 8888
8 8888    ,88'          .888.                 ,888.     ,888.          8 8888     8888     `88.   . 8888     `88.         8 8888          8888     `88.  8 8888        8  8 8888
8 8888   ,88'          :88888.               .`8888.   .`8888.         8 8888  ,8 8888       `8. ,8 8888       `8b        8 8888       ,8 8888       `8. 8 8888        8  8 8888
8 8888  ,88'          . `88888.             ,8.`8888. ,8.`8888.        8 8888  88 8888           88 8888        `8b       8 8888       88 8888           8 8888        8  8 8888
8 8888 ,88'          .8. `88888.           ,8'8.`8888,8^8.`8888.       8 8888  88 8888           88 8888         88       8 8888       88 8888           8 8888        8  8 8888
8 8888 88'          .8`8. `88888.         ,8' `8.`8888' `8.`8888.      8 8888  88 8888           88 8888         88       8 8888       88 8888           8 8888        8  8 8888
8 888888<          .8' `8. `88888.       ,8'   `8.`88'   `8.`8888.     8 8888  88 8888   8888888 88 8888        ,8P       8 8888       88 8888           8 8888888888888  8 8888
8 8888 `Y8.       .8'   `8. `88888.     ,8'     `8.`'     `8.`8888.    8 8888  `8 8888       .8' `8 8888       ,8P        8 8888       `8 8888       .8' 8 8888        8  8 8888
8 8888   `Y8.    .888888888. `88888.   ,8'       `8        `8.`8888.   8 8888     8888     ,88'   ` 8888     ,88'         8 8888          8888     ,88'  8 8888        8  8 8888
8 8888     `Y8. .8'       `8. `88888. ,8'         `         `8.`8888.  8 8888      `8888888P'        `8888888P'           8 8888           `8888888P'    8 8888        8  8 8888
```

_may they spare your soul_
