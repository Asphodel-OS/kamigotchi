import { Battery, TextTooltip } from '../..';

interface Props {
  current: number;
  total: number;
}

export const Health = (props: Props) => {
  const { current, total } = props;

  return (
    <TextTooltip key='battery' text={[`Health: ${current}/${total}`]}>
      <Battery level={(100 * current) / total} scale={1.2} />
    </TextTooltip>
  );
};
