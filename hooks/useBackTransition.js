/**
 * Utility for adding smooth back button transitions to any screen
 *
 * HOW TO USE:
 * 1. Import: import { useBackTransition } from '../hooks/useBackTransition';
 * 2. Add to component: const fadeAnim = useBackTransition();
 * 3. Wrap content: <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
 *
 * Works for any screen with a back button!
 */

import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export const useBackTransition = (duration = 1000) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(false);

  useEffect(() => {
    // Only animate on mount, not unmount
    if (!isMounted.current) {
      isMounted.current = true;

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }

    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, [fadeAnim]);

  return fadeAnim;
};

// Export as useFadeAnimation for compatibility
export const useFadeAnimation = useBackTransition;

/**
 * Simple wrapper component for screens with back buttons
 * Usage: <BackTransitionScreen><YourContent /></BackTransitionScreen>
 */
export const BackTransitionScreen = ({
  children,
  duration = 1000,
  style = {},
}) => {
  const fadeAnim = useBackTransition(duration);

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
