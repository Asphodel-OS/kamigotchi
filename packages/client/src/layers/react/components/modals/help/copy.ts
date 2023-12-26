import { HelpTabs, PageCopy } from "./types";
import { HelpBanners } from 'assets/images/banners';
import { HelpMenuIcons } from 'assets/images/icons/help';


const WelcomeCopy: PageCopy = {
  title: "Welcome to Kamigotchi",
  header: HelpBanners.welcome,
  body: [""],
};

const StartingCopy: PageCopy = {
  title: "Getting Started",
  menuIcon: HelpMenuIcons.starting,
  header: HelpBanners.starting,
  body: [
    "Welcome to Kamigotchi World.",
    "You can move using the map.",
    "",
    "Look for a vending machine and for Nodes scattered throughout the world.",
    "",
    "You may want to find Kamigotchi if you want to influence this world, but you're welcome to explore either way.",
    "",
    "It's possible to rename your Kamigotchi somewhere in-game.",
  ],
};

const KamiCopy: PageCopy = {
  title: "What's a Kamigotchi?",
  menuIcon: HelpMenuIcons.kamis,
  header: HelpBanners.whatKami,
  body: [
    "Kamigotchi are vibrant individuals who exist to provide you with emotional support and value. You can convert their health and well-being into $MUSU by sending them to work at Nodes.",
    "",
    "Kamigotchi have several different statistics that determine their abilities. Base statistics are determined by a Kami's Traits. Traits are separated into rarity tiers. Some are extremely uncommon. Rarer traits usually give more stat points.",
    "",
    "Kamigotchi also have Types, determined by their Arm and Body traits. Kamigotchi can be Normal, Eerie, Scrap, or Insect types, and the Arm and Body can have different Types - leading to a dual-type Kami, for example Normal/Insect.",
    "",
    "Health determines a Kami's well being. The lower a Kami's health, the easier it is for them to be liquidated by other Kami, which kills them. Dead Kamigotchi must be resurrected using a Ribbon.",
    "",
    "Health drains slowly when harvesting on a node. As Health drains, Kamigotchi produce $MUSU based on their Power stat. More Power increases both Health drain rate and the level of $MUSU generated.",
    "",
    "Your Kamigotchi are fiercely independent and will gradually regenerate health if left to their own devices, but can be fed to speed this process.",
    "",
    "Violence and Harmony determine a Kami's capacity for attack and defense. The Health threshold for liquidating a Kami on a Node is determined by the difference between the attacker's Violence and the defender's Harmony.",
    "",
    "Slots are mysterious. We'll explain more on them later.",
  ],
};

const NodeCopy: PageCopy = {
  title: "What's a Node?",
  menuIcon: HelpMenuIcons.nodes,
  header: HelpBanners.whatNode,
  body: [
    "Nodes are sites of spiritual significance within Kamigotchi World. Kamigotchi, and only Kamigotchi, can generate $MUSU by gathering energy at Nodes. This costs Kamigotchi health, and can leave them vulnerable to attack from other Kamigotchi.",
    "",
    "Some nodes have a type affinity, such as Eerie or Scrap. You may be able to find more $MUSU by harvesting on these nodes with Kami that share the same affinity.",
  ],
};

const WorldCopy: PageCopy = {
  title: "Kamigotchi World",
  menuIcon: HelpMenuIcons.nodes,
  header: HelpBanners.world,
  body: [
    "Kamigotchi World is an Autonomous World that exists entirely on-chain.",
    "",
    "All actions taken within this world are blockchain transactions. Your Operator - that is, the entity you named on entry - is a representation of you within this world.",
  ],
};

export const CopyInfo = {
  [HelpTabs.HOME]: WelcomeCopy,
  [HelpTabs.START]: StartingCopy,
  [HelpTabs.KAMIS]: KamiCopy,
  [HelpTabs.NODES]: NodeCopy,
  [HelpTabs.WORLD]: WorldCopy,
};
