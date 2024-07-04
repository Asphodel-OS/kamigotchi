import { HelpBanners } from 'assets/images/banners';
import { HelpMenuIcons } from 'assets/images/help';
import { HelpTabs, PageCopy } from './types';

const WelcomeCopy: PageCopy = {
  title: 'Welcome to Kamigotchi',
  header: HelpBanners.welcome,
  body: [''],
};

const WorldCopy: PageCopy = {
  title: 'Kamigotchi World',
  menuIcon: HelpMenuIcons.starting,
  header: HelpBanners.world,
  body: [
    `Welcome to the Kamigotchi World beta.`,
    ``,
    `Firstly, if you haven't already, you should follow the first few quests to mint your testnet Kamigotchi and get used to the game. This guide has more details on Kamigotchi both as a game and as a protocol....`,
    ``,
    `You are currently playing on Yominet - the Kamigotchi chain. This is still a testnet, and this world isn't yet the true Kamigotchi World. We'll be preparing our mainnet release over the next few months - if you're here now, you're very early. But maybe that's a good thing.`,
    ``,
    `There are some things you can find in this world that you'll be able to take with you to mainnet. You'll learn more about that over time.`,
  ],
};

const KamiCopy: PageCopy = {
  title: 'On Kamigotchi',
  menuIcon: HelpMenuIcons.kamis,
  header: HelpBanners.whatKami,
  body: [
    `Kamigotchi are network spirits who exist to provide you with emotional support and value. You can convert their health and well-being into MUSU by sending them to Harvest.`,
    ``,
    `Kamigotchi have several different statistics that determine their abilities. Base statistics are determined by a Kami's Traits. Traits are separated into rarity tiers. Some are extremely uncommon. Rarer traits usually give more stat points.`,
    ``,
    `Kamigotchi also have Types, determined by their Arm and Body traits. Kamigotchi can be Normal, Eerie, Scrap, or Insect types, and the Arm and Body can have different Types - leading to a dual-type Kami, such as Normal/Insect.`,
    ``,
    `Health determines a Kami's well-being. The lower a Kami's health, the easier it is for them to be liquidated by other Kami, which is lethal. Dead Kamigotchi must be resurrected using items or objects found in this world.`,
    ``,
    `Health drains when harvesting on a node. As Health drains, Kamigotchi produce MUSU. Power increases both the Health drain rate and the rate of MUSU generated.`,
    ``,
    `Your Kamigotchi are fiercely independent and will gradually regenerate health if left to their own devices, but can be fed to speed this process.`,
    ``,
    `Violence and Harmony determine a Kami's capacity for attack and defense. The Health threshold for liquidating a Kami on a Node is determined by the difference between the attacker's Violence and the defender's Harmony.`,
    ``,
    `Slots are mysterious. We'll explain more on them later.`,
  ],
};

const NodeCopy: PageCopy = {
  title: 'Harvesting',
  menuIcon: HelpMenuIcons.nodes,
  header: HelpBanners.whatNode,
  body: [
    `It's possible to Harvest at most places in this world.`,
    ``,
    `Kamigotchi, and only Kamigotchi, can generate MUSU by harvesting. This costs Kamigotchi health, and can leave them vulnerable to attack from other Kamigotchi.`,
    ``,
    `Each room in this world has its own type affinity, such as Eerie or Scrap. Kamigotchi harvest faster on rooms that share their type, and more slowly on opposite-typed nodes.`,
    ``,
    `More to Harvesting will be revealed soon. For now, it's the best way to gather MUSU....`,
  ],
};

export const CopyInfo = {
  [HelpTabs.HOME]: WelcomeCopy,
  [HelpTabs.WORLD]: WorldCopy,
  [HelpTabs.KAMIS]: KamiCopy,
  [HelpTabs.NODES]: NodeCopy,
};
