import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";

const ScreenAnimation = ({ children, duration = 200 }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // Only run animation once per component instance
    if (hasAnimatedRef.current) return;

    // Start animation immediately after mount
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        hasAnimatedRef.current = true;
      });
    }, 50); // Reduced delay for faster response

    return () => clearTimeout(timer);
  }, []); // Empty dependency array - run once on mount

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        flex: 1,
      }}
    >
      {children}
    </Animated.View>
  );
};

export default ScreenAnimation;
