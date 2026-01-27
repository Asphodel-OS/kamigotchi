import { Item } from 'app/cache/item';
import { TooltipContent } from 'app/components/library';
import { getItemRarities } from 'constants/itemRarities';
import { Allo } from 'network/shapes/Allo';
import { DetailedEntity } from 'network/shapes/utils';

export const ItemTooltip = ({
  item,
  utils: { displayRequirements, parseAllos },
}: {
  item: Item;
  utils: {
    displayRequirements: (item: Item) => string;
    parseAllos: (allo: Allo[]) => DetailedEntity[];
  };
}) => {
  const image = item.image;
  const title = item.name;
  const type = item.type;
  const description = item.description;
  const requirements = item.requirements;
  const rarity = getItemRarities(item.rarity ?? 0) ?? getItemRarities(0);
  const rarityColor = rarity.color;
  const display = (item: Item) => {
    const disp = displayRequirements(item);
    if (disp === '???') return 'None';
    else return disp;
  };

  const getEffectsString = (item: Item) => {
    const isLootbox = type === 'LOOTBOX';
    const effects = item.effects;
    let text = '';

    if (!isLootbox && effects?.use?.length > 0) {
      text = parseAllos(effects.use)
        .map((entry) => entry.description)
        .join('\n');
    } else text = 'None';

    return text;
  };

  return (
    <TooltipContent
      img={image}
      title={item.is.disabled ? `${title} (disabled)` : title}
      subtitle={{ text: 'Type', content: type }}
      description={description}
      left={{
        text: 'Requirements',
        content: requirements?.use?.length > 0 ? display(item) : 'None',
      }}
      right={{
        text: 'Effects',
        content: getEffectsString(item),
      }}
      borderColor={rarityColor}
      titleColor={rarityColor}
    />
  );
};
