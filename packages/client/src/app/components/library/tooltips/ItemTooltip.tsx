import { Item } from 'app/cache/item';
import { TooltipContent } from 'app/components/library';
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
  const effects = item.effects;

  const isLootbox = type === 'LOOTBOX';

  const display = (item: Item) => {
    const disp = displayRequirements(item);
    if (disp === '???') return 'None';
    else return disp;
  };

  return (
    <TooltipContent
      img={image}
      title={title}
      subtitle={{ text: 'Type', content: type }}
      description={description}
      left={{
        text: 'Requirements',
        content: requirements?.use?.length > 0 ? display(item) : 'None',
      }}
      right={{
        text: 'Effects',
        content:
          !isLootbox && effects?.use?.length > 0
            ? parseAllos(effects.use)
                .map((entry) => entry.description)
                .join('\n')
            : 'None',
      }}
    />
  );
};
