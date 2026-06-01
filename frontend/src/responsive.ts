import { Dimensions, PixelRatio, Platform, useWindowDimensions } from 'react-native';

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const WIN = Dimensions.get('window');
const SSR_WIDTH = WIN.width > 0 ? WIN.width : 800;
const SSR_HEIGHT = WIN.height > 0 ? WIN.height : 900;

export function scale(size: number): number {
  const s = SSR_WIDTH / BASE_WIDTH;
  const val = size * Math.min(s, 1.8);
  return Math.round(PixelRatio.roundToNearestPixel(Math.max(val, size * 0.6)));
}

export function fontScale(size: number): number {
  const s = SSR_WIDTH / BASE_WIDTH;
  const val = size * Math.min(s, 1.5);
  return Math.round(PixelRatio.roundToNearestPixel(Math.max(val, size * 0.8)));
}

export function wp(percent: number): number {
  return (SSR_WIDTH * percent) / 100;
}

export function hp(percent: number): number {
  return (SSR_HEIGHT * percent) / 100;
}

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const safeW = width > 0 ? width : SSR_WIDTH;
  const isTablet = safeW >= 768;
  const isWeb = Platform.OS === 'web';
  const isSmall = safeW < 360;

  const sc = (size: number) => {
    const s = safeW / BASE_WIDTH;
    return Math.round(PixelRatio.roundToNearestPixel(size * Math.min(s, isTablet ? 2 : 1.8)));
  };

  return {
    width: safeW,
    height: height > 0 ? height : SSR_HEIGHT,
    isTablet,
    isWeb,
    isSmall,
    scale: sc,
    fontScale: (size: number) => {
      const s = safeW / BASE_WIDTH;
      const val = size * Math.min(s, isTablet ? 1.6 : 1.4);
      return Math.round(PixelRatio.roundToNearestPixel(Math.max(val, size * 0.8)));
    },
    contentWidth: isTablet ? Math.min(safeW - 48, 800) : Math.max(safeW - 32, 320),
  };
}
