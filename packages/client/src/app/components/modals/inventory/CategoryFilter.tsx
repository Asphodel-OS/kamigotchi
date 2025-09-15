import React from 'react';
import styled from 'styled-components';

export type ItemCategory = 'All' | 'Consumables' | 'Lootboxes' | 'Materials';

interface CategoryFilterProps {
  selectedCategory: ItemCategory;
  onCategoryChange: (category: ItemCategory) => void;
}

const categories = [
  { 
    id: 'All' as ItemCategory, 
    label: 'All', 
    description: 'Show all items'
  },
  { 
    id: 'Consumables' as ItemCategory, 
    label: 'Consumables', 
    description: 'Food, potions, and kami items'
  },
  { 
    id: 'Lootboxes' as ItemCategory, 
    label: 'Lootboxes', 
    description: 'Gacha tickets and mystery boxes'
  },
  { 
    id: 'Materials' as ItemCategory, 
    label: 'Materials', 
    description: 'Crafting materials and drops'
  },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <Container>
      <Title>Filter by Category</Title>
      <ButtonGrid>
        {categories.map((category) => (
          <CategoryButton
            key={category.id}
            isSelected={selectedCategory === category.id}
            onClick={() => onCategoryChange(category.id)}
            title={category.description}
          >
            {category.label}
          </CategoryButton>
        ))}
      </ButtonGrid>
    </Container>
  );
};

// Helper function to categorize items (exported for use in ItemGrid)
export const categorizeItem = (item: any): ItemCategory => {
  const { type } = item;
  
  // Lootboxes
  if (type === 'LOOTBOX') {
    return 'Lootboxes';
  }
  
  // Consumables
  if (['FOOD', 'REVIVE', 'SKILL_RESET', 'RENAME_POTION'].includes(type)) {
    return 'Consumables';
  }
  
  // Default to Materials for everything else (including currencies)
  return 'Materials';
};

const Container = styled.div`
  margin-bottom: 0.4vw;
  padding: 0.4vw;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.3vw;
  border: 0.1vw solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h3`
  margin: 0 0 0.3vw 0;
  font-size: 0.7vw;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
`;

const ButtonGrid = styled.div`
  display: flex;
  gap: 0.2vw;
  flex-wrap: wrap;
`;

const CategoryButton = styled.button<{ isSelected: boolean }>`
  padding: 0.3vw 0.5vw;
  border: 0.1vw solid ${({ isSelected }) => 
    isSelected ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 0.2vw;
  background: ${({ isSelected }) => 
    isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.3)'};
  color: ${({ isSelected }) => 
    isSelected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.6vw;
  font-family: inherit;
  font-weight: 500;
  white-space: nowrap;

  &:hover {
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
  }

  &:active {
    transform: translateY(0.05vw);
  }
`;

