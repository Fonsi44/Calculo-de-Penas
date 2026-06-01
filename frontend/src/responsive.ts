import { Dimensions, PixelRatio, Platform, useWindowDimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export function scale(size: number): number {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * Math.min(scale, 1.8);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

export function fontScale(size: number): number {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * Math.min(scale, 1.5);
  return Math.round(PixelRatio.roundToNearestPixel(Math.max(newSize, size * 0.85)));
}

export function wp(percent: number): number {
  return (SCREEN_WIDTH * percent) / 100;
}

export function hp(percent: number): number {
  return (SCREEN_HEIGHT * percent) / 100;
}

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isWeb = Platform.OS === 'web';
  const isSmall = width < 360;

  return {
    width,
    height,
    isTablet,
    isWeb,
    isSmall,
    scale: (size: number) => {
      const s = width / BASE_WIDTH;
      return Math.round(PixelRatio.roundToNearestPixel(size * Math.min(s, isTablet ? 2 : 1.8)));
    },
    fontScale: (size: number) => {
      const s = width / BASE_WIDTH;
      const newSize = size * Math.min(s, isTablet ? 1.6 : 1.4);
      return Math.round(PixelRatio.roundToNearestPixel(Math.max(newSize, size * 0.8)));
    },
    contentWidth: isTablet ? Math.min(width - 48, 800) : width - 32,
  };
}
