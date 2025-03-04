import styled from 'styled-components';

import { Card, Tooltip } from 'app/components/library';
import { CraftButton } from 'app/components/library/actions/CraftButton';
import { ExpIcon, StaminaIcon } from 'assets/images/icons/stats';
import { Account } from 'network/shapes/Account';
import { NullItem } from 'network/shapes/Item';
import { Recipe } from 'network/shapes/Recipe';
import { Input } from './Input';

interface Props {
  data: {
    account: Account;
    recipe: Recipe;
    stamina: number;
  };
  actions: {
    craft: () => void;
  };
  utils: {
    displayRequirements: (recipe: Recipe) => string;
    getItemBalance: (index: number) => number;
    meetsRequirements: (recipe: Recipe) => boolean;
  };
}

export const RecipeCard = (props: Props) => {
  const { actions, data, utils } = props;
  const { recipe, stamina } = data;

  const output = recipe.outputs[0];
  const inputs = recipe.inputs;
  const item = output.item ?? NullItem;
  const quantity = output.amount;

  const getTooltipText = () => {
    const text = [
      `Requires: ${utils.displayRequirements(recipe)}`,
      `Grants: ${recipe.experience} xp`,
      `Costs: ${recipe.cost.stamina} stamina`,
    ];
    recipe.inputs.forEach((input) => {
      const itemName = input.item?.name ?? '???';
      text.push(`• ${input.amount} ${itemName}`);
    });

    return text;
  };

  return (
    <Card
      key={recipe.index}
      image={{ icon: item.image, scale: 7.5, padding: 1, overlay: `${quantity}` }}
      fullWidth
    >
      <TitleBar>
        <TitleText key='title'>{item.name}</TitleText>
        <TitleCorner key='corner'>
          <Text>{recipe.experience}</Text>
          <Icon src={ExpIcon} />
        </TitleCorner>
      </TitleBar>
      <Content>
        <Tooltip text={getTooltipText()} direction='row' grow>
          <ContentRow key='column-1'>
            {inputs.map((input, i) => (
              <Input
                key={`input-${i}`}
                image={input.item?.image ?? ''}
                amt={input.amount}
                prepend={i != 0 ? '+' : '='}
              />
            ))}
            <Input image={StaminaIcon} amt={recipe.cost.stamina} prepend='+' />
          </ContentRow>
        </Tooltip>
        <ContentColumn key='column-2'>
          <Actions>
            <CraftButton data={{ recipe, quantity: 1, stamina }} actions={actions} utils={utils} />
          </Actions>
        </ContentColumn>
      </Content>
    </Card>
  );
};

const TitleBar = styled.div`
  border-bottom: solid black 0.15vw;
  padding: 0.45vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  user-select: none;
`;

const TitleText = styled.div`
  display: flex;
  justify-content: flex-start;

  font-size: 1vw;
  text-align: left;
`;

const TitleCorner = styled.div`
  display: flex;
  flex-grow: 1;
  align-items: center;
  justify-content: flex-end;

  gap: 0.15vw;
`;

const Text = styled.div`
  font-size: 0.9vw;
  padding-top: 0.05vw;
`;

const Icon = styled.img`
  height: 1.8vw;
`;

const Content = styled.div`
  display: flex;
  flex-grow: 1;
  flex-flow: row nowrap;
  align-items: stretch;

  padding: 0.2vw;
`;

const ContentRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;

const ContentColumn = styled.div`
  display: flex;
  flex-flow: column nowrap;
  flex-grow: 1;
  justify-content: flex-end;

  margin: 0.2vw;
  padding-top: 0.2vw;
`;

const Actions = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  gap: 0.4vw;
`;
