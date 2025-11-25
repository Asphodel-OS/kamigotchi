import styled from 'styled-components';

import { TooltipContent } from 'app/components/library';
import { ExpIcon, StaminaIcon } from 'assets/images/icons/stats';
import { Item, NullItem } from 'network/shapes/Item';
import { Recipe } from 'network/shapes/Recipe';

export const RecipeTooltip = ({
  recipe,
  utils,
}: {
  recipe: Recipe;
  utils: {
    getItemByIndex: (itemIndex: number) => Item;
  };
}) => {
  const output = recipe.outputs[0];
  const item = output.item ?? NullItem;

  /////////////////
  // INTERPRETATION

  const getSubtitle = () => {
    return (
      <>
        {recipe.experience} <Icon src={ExpIcon} />
      </>
    );
  };

  // retrieves the requirements of the recipe (e.g. tools)
  const getRequirements = () => {
    return recipe.requirements.map((req, i) => (
      <Requirements key={`req-${req.target?.index ?? i}`}>
        {Number(req.target?.value ?? 0)}
        <Icon key='img' src={utils.getItemByIndex(req.target?.index ?? 0).image} />
      </Requirements>
    ));
  };

  // gets the ingredients and costs of the recipe
  const getCosts = () => {
    const text = [
      <p key='stamina'>
        {recipe.cost.stamina} <img style={{ width: '1.2vw' }} src={StaminaIcon} />
      </p>,
    ];
    recipe.inputs.forEach((input, i) => {
      const itemName = input.item?.name ?? '???';
      text.push(
        <Costs key={`cost-${i}`}>
          {'\u2022 '}
          {input.amount} {itemName}
        </Costs>
      );
    });
    return text;
  };

  /////////////////
  // RENDER

  return (
    <TooltipContent
      img={item.image}
      title={`Recipe for ${item.name}`}
      subtitle={{ text: 'Grants', content: getSubtitle() }}
      left={{ text: 'Requirements', content: getRequirements(), align: 'flex-start' }}
      right={{ text: 'Costs', content: getCosts(), align: 'flex-start' }}
    />
  );
};

const Icon = styled.img`
  height: 1.2vw;
`;

const Requirements = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3vw;
`;

const Costs = styled.p`
  margin-left: 7.5%;
  text-align: left;
  overflow-wrap: break-word;
`;
