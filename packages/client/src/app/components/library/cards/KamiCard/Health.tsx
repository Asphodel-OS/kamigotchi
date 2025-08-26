import { Battery, TextTooltip } from '../..';

export const Health = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => {
  return (
    <TextTooltip key='battery' text={[`Health: ${current}/${total}`]}>
      <Battery level={(100 * current) / total} scale={1.2} />
    </TextTooltip>
  );
};
