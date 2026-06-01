import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from './responsive';
import { COLORS } from './theme';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
}

export default function Container({ children, style, maxWidth }: Props) {
  const { isTablet, isWeb } = useResponsive();
  const shouldConstrain = isTablet || isWeb;

  if (!shouldConstrain) {
    return <View style={[{ flex: 1 }, style]}>{children}</View>;
  }

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.inner, { maxWidth: maxWidth ?? 800 }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    width: '100%',
  },
});
