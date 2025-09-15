import { useState } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';

export type ItemCategory = 'All' | 'Consumables' | 'Lootboxes' | 'Materials';

interface CategoryFilterProps {
  selectedCategory: ItemCategory;
  onCategoryChange: (category: ItemCategory) => void;
}

interface CategoryOption {
  id: ItemCategory;
  label: string;
  description: string;
}

const categories: CategoryOption[] = [
  { 
    id: 'All', 
    label: 'All', 
    description: 'Show all items'
  },
  { 
    id: 'Consumables', 
    label: 'Consumables', 
    description: 'Food, potions, and kami items'
  },
  { 
    id: 'Lootboxes', 
    label: 'Lootboxes', 
    description: 'Gacha tickets and mystery boxes'
  },
  { 
    id: 'Materials', 
    label: 'Materials', 
    description: 'Crafting materials and drops'
  },
];

// Category filter component with sliding animation
export const CategoryFilter = ({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSortClick = () => {
    playClick();
    setIsOpen(!isOpen);
  };

  const handleCategoryClick = (category: ItemCategory) => {
    playClick();
    onCategoryChange(category);
    setIsOpen(false);
  };

  return (
    <Container>
      <SortButton onClick={handleSortClick}>
        Sort
      </SortButton>
      
      <CategoryButtons isOpen={isOpen}>
        {categories.map((category) => (
          <CategoryButton
            key={category.id}
            isSelected={selectedCategory === category.id}
            onClick={() => handleCategoryClick(category.id)}
            title={category.description}
          >
            {category.label}
          </CategoryButton>
        ))}
      </CategoryButtons>
    </Container>
  );
};

// Helper function to categorize items (exported for use in ItemGrid)
export const categorizeItem = (item: { type: string }): ItemCategory => {
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
  display: flex;
  align-items: center;
  position: relative;
`;

const SortButton = styled.button`
  padding: 0.3vw 0.75vw;
  border: 0.15vw solid rgba(255, 255, 255, 0.6);
  border-radius: 0.3vw;
  background: rgba(0, 0, 0, 0.5);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75vw;
  font-family: inherit;
  font-weight: 600;
  white-space: nowrap;
  min-width: 3vw;

  &:hover {
    border-color: rgba(255, 255, 255, 0.9);
    background: rgba(0, 0, 0, 0.7);
    color: rgba(255, 255, 255, 1);
  }

  &:active {
    transform: translateY(0.05vw);
    background: rgba(0, 0, 0, 0.8);
  }
`;

const CategoryButtons = styled.div<{ isOpen: boolean }>`
  display: flex;
  gap: 0.3vw;
  margin-left: 0.5vw;
  transform: ${({ isOpen }) => isOpen ? 'translateX(0)' : 'translateX(-100%)'};
  opacity: ${({ isOpen }) => isOpen ? 1 : 0};
  transition: all 0.3s ease;
  pointer-events: ${({ isOpen }) => isOpen ? 'auto' : 'none'};
`;

const CategoryButton = styled.button<{ isSelected: boolean }>`
  padding: 0.3vw 0.6vw;
  border: 0.15vw solid ${({ isSelected }) => 
    isSelected ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)'};
  border-radius: 0.3vw;
  background: ${({ isSelected }) => 
    isSelected ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.5)'};
  color: ${({ isSelected }) => 
    isSelected ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.9)'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75vw;
  font-family: inherit;
  font-weight: 600;
  white-space: nowrap;
  min-width: 4vw;

  &:hover {
    border-color: rgba(255, 255, 255, 0.9);
    background: rgba(0, 0, 0, 0.7);
    color: rgba(255, 255, 255, 1);
  }

  &:active {
    transform: translateY(0.05vw);
    background: rgba(0, 0, 0, 0.8);
  }
`;

