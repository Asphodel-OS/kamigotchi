import { ComponentProps } from 'react';

import { ButtonExtension, ButtonExtensionProps } from './ButtonExtension';
import { IconButton } from './IconButton';

type IconButtonProps = ComponentProps<typeof IconButton>;

// an IconButton with a ButtonExtension panel, sharing one corner radius.
// `extension` takes every ButtonExtension option except the button and radius
export const ExpandableIconButton = ({
  extension,
  ...button
}: IconButtonProps & {
  extension: Omit<ButtonExtensionProps, 'children' | 'radius'>;
}) => {
  const radius = button.radius ?? 0.45; // IconButton's default
  const orientation = button.scaleOrientation ?? 'vw';

  return (
    // a disabled button also disables its panel, so the panel can't act on the button's behalf
    <ButtonExtension
      {...extension}
      disabled={button.disabled || extension.disabled}
      radius={`${radius}${orientation}`}
    >
      <IconButton {...button} radius={radius} />
    </ButtonExtension>
  );
};
