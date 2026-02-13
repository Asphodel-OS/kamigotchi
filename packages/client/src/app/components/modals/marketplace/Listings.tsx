import { useState } from 'react';
import styled from 'styled-components';

import FilterListIcon from '@mui/icons-material/FilterList';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { IconButton, IconListButton, TextTooltip } from 'app/components/library';

export const Listings = ({
  isVisible,
  onOpenFilter,
}: {
  isVisible: boolean;
  onOpenFilter: () => void;
}) => {
  const [sortBy, setSortBy] = useState<string>('');
  const sortOptions = [{ text: 'Latest', onClick: () => setSortBy('Latest') }];

  return (
    <Tab isVisible={isVisible}>
      <ButtonWrapper>
        <TextTooltip text={['Sorting']}>
          <IconListButton img={SwapVertIcon as any} options={sortOptions} radius={0.6} />
        </TextTooltip>
        <TextTooltip text={['Filters']}>
          <IconButton img={FilterListIcon} onClick={onOpenFilter} />
        </TextTooltip>
        <TextTooltip text={['Cart']}>
          <IconButton img={ShoppingCartIcon} onClick={() => {}} />
        </TextTooltip>
      </ButtonWrapper>
      <Placeholder>Listings coming soon...</Placeholder>
    </Tab>
  );
};

const Tab = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 1;
  overflow: auto;
  width: 100%;
  min-height: 10vw;
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 0.4vw;
  padding: 0.4vw;
  width: fit-content;
`;

const Placeholder = styled.div`
  padding: 1vw;
  text-align: center;
  color: #666;
  font-size: 0.9vw;
`;
