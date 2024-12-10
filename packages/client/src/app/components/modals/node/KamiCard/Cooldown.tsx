import { Countdown, Tooltip } from '../../../library/base';

interface Props {
  total: number;
  current: number;
}

export const Cooldown = (props: Props) => {
  const { total, current } = props;

  return (
    <Tooltip key='cooldown' text={[`Cooldown: ${Math.round(current)}s`]}>
      <Countdown total={total} current={current} />
    </Tooltip>
  );
};
