import { useEffect, useState } from "react";
import { Animated } from "react-native";

const ScreenAnimation = ({ children, duration = 400 }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  useEffect(() => {
    // Reset animations to initial values
    fadeAnim.setValue(0);
    slideAnim.setValue(30);

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
      ]).start(() => {});
    }, 100); // Small delay to ensure component is mounted

    return () => clearTimeout(timer);
  }, []); // Empty dependency array - run only on mount

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
