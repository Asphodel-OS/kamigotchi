import { Battery, Tooltip } from '../../../library/base';

interface Props {
  current: number;
  total: number;
}

export const Health = (props: Props) => {
  const { current, total } = props;

  return (
    <Tooltip key='battery' text={[`Health: ${current}/${total}`]}>
      <Battery level={(100 * current) / total} scale={1.2} />
    </Tooltip>
  );
};
