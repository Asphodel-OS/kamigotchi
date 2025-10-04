import { Item } from 'app/cache/item';
import { StyledTooltipText } from 'app/components/library/poppers';
import { Allo } from 'network/shapes/Allo';
import { DetailedEntity } from 'network/shapes/utils';

export const ItemGridTooltip = ({
  item,
  utils: { displayRequirements, parseAllos },
}: {
  item: Item;
  utils: {
    displayRequirements: (recipe: Item) => string;
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
    <StyledTooltipText
      img={image}
      title={title}
      subTitleText='Type'
      subTitleContent={type}
      description={description}
      leftSideText='Requirements'
      leftSideContent={requirements?.use?.length > 0 ? display(item) : 'None'}
      rightSideText='Effects'
      rightSideContent={
        !isLootbox && effects?.use?.length > 0
          ? parseAllos(effects.use)
              .map((entry) => entry.description)
              .join('\n')
          : 'None'
      }
    />
  );
};
