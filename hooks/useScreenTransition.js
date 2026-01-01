import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";

/**
 * Custom hook for smooth fade-in animation on screen mount
 * Provides consistent transition experience across all screens
 */
export const useScreenTransition = (duration = 1000) => {
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const isMounted = useRef(false);

  useEffect(() => {
    // Only animate if component is mounting (not unmounting)
    if (!isMounted.current) {
      isMounted.current = true;

      // Start fade-in animation
      Animated.timing(fadeAnim.current, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }

    // Cleanup on unmount
    return () => {
      isMounted.current = false;
    };
  }, []);

  return fadeAnim.current;
};

/**
 * HOC that wraps screen content with smooth fade transition
 * Usage: <ScreenTransition><YourScreenContent /></ScreenTransition>
 */
export const ScreenTransition = ({ children, duration = 1000, style = {} }) => {
  const fadeAnim = useScreenTransition(duration);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        flex: 1,
        ...style,
      }}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Simple hook for screens without SafeAreaView wrapper
 * Just returns the animated value for manual implementation
 */
export const useFadeAnimation = (duration = 1000) => {
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      Animated.timing(fadeAnim.current, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }
    return () => {
      isMounted.current = false;
    };
  }, []);

  return fadeAnim.current;
};
