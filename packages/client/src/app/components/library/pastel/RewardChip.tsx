import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { DetailedEntity } from 'network/shapes/utils';
import { Palette, prettyName } from './palette';

// icon tile with an amount badge; the tooltip carries only the name and description
export const RewardChip = ({
  entity,
  amount,
  badge,
  size = 'md',
}: {
  entity: DetailedEntity;
  amount?: number;
  badge?: string; // replaces the default "xN" badge
  size?: 'md' | 'sm';
}) => {
  const name = prettyName(entity.name);
  const qty = amount ? amount * 1 : 0;
  const badgeText = badge ?? (qty ? `x${qty}` : '');

  return (
    <Tooltip
      content={<RewardTooltip entity={entity} name={name} />}
      maxWidth={16}
      isDisabled={false}
    >
      <Tile size={size}>
        <Icon size={size} src={entity.image} alt={name} />
        {!!badgeText && <Badge>{badgeText}</Badge>}
      </Tile>
    </Tooltip>
  );
};

export const RewardTooltip = ({ entity, name }: { entity: DetailedEntity; name: string }) => (
  <Tip>
    <Head>
      <TipIcon>
        <img src={entity.image} alt={name} />
      </TipIcon>
      <Name>{name}</Name>
    </Head>
    {entity.description && <Text>{entity.description}</Text>}
  </Tip>
);

const Tile = styled.div<{ size: 'md' | 'sm' }>`
  position: relative;
  flex: none;
  width: ${({ size }) => (size === 'sm' ? 2.3 : 3)}vw;
  height: ${({ size }) => (size === 'sm' ? 2.3 : 3)}vw;
  display: flex;
  align-items: center;
  justify-content: center;

  background: ${Palette.paper};
  border: solid ${Palette.ink} 0.12vw;
  border-radius: 0.5vw;
  transition: transform 0.1s ease;

  &:hover {
    transform: translateY(-0.1vw);
  }
`;

const Icon = styled.img<{ size: 'md' | 'sm' }>`
  width: ${({ size }) => (size === 'sm' ? 1.5 : 2)}vw;
  height: ${({ size }) => (size === 'sm' ? 1.5 : 2)}vw;
`;

const Badge = styled.span`
  position: absolute;
  right: -0.4vw;
  bottom: -0.4vw;
  padding: 0.12vw 0.25vw;

  font-family: Pixel;
  font-size: 0.55vw;
  line-height: 1;
  color: ${Palette.ink};
  background: ${Palette.paper};
  border: solid ${Palette.ink} 0.1vw;
  border-radius: 0.3vw;
`;

const Tip = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55vw;
  min-width: 11vw;
  text-align: left;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6vw;
`;

const TipIcon = styled.div`
  flex: none;
  width: 2.4vw;
  height: 2.4vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Palette.soft};
  border: solid ${Palette.line} 0.1vw;
  border-radius: 0.45vw;

  img {
    width: 1.8vw;
    height: 1.8vw;
  }
`;

const Name = styled.span`
  font-family: Pixel;
  font-size: 0.72vw;
  line-height: 1.3;
  color: ${Palette.ink};
`;

const Text = styled.p`
  padding-top: 0.5vw;
  border-top: solid ${Palette.line} 0.08vw;
  font-family: Pixel;
  font-size: 0.58vw;
  line-height: 1.6;
  color: ${Palette.muted};
`;
