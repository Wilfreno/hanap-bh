import { render } from '@testing-library/react-native';

import { ThemedText } from '../themed-text';

describe('ThemedText', () => {
  it('renders its children', () => {
    const { getByText } = render(<ThemedText>Hello Hanap</ThemedText>);

    expect(getByText('Hello Hanap')).toBeTruthy();
  });

  it('applies the theme text color', () => {
    const { getByText } = render(<ThemedText>Colored</ThemedText>);

    const node = getByText('Colored');
    const flattened = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style.flat())
      : node.props.style;

    // light theme text color from constants/theme.ts
    expect(flattened.color).toBe('#000000');
  });
});
