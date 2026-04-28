import { Text } from 'react-native';

interface MaterialIconProps {
  name: string;
  fill?: boolean;
  size?: number;
  className?: string;
}

export function MaterialIcon({
  name,
  fill = false,
  size = 24,
  className = '',
}: MaterialIconProps): React.ReactElement {
  return (
    <Text
      className={`material-symbols-outlined ${fill ? 'fill' : ''} ${className}`}
      style={{ fontSize: size, lineHeight: size }}
      selectable={false}
    >
      {name}
    </Text>
  );
}
