import { useEffect, useRef } from "react";
import { Animated } from "react-native";

const ScreenAnimation = ({ children, duration = 400 }) => {
  const fadeAnim = useRef(new Animated.Value(0));
  const slideAnim = useRef(new Animated.Value(30));

  useEffect(() => {
    // Start animation immediately after mount
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim.current, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim.current, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start(() => {});
    }, 100); // Small delay to ensure component is mounted

    return () => clearTimeout(timer);
  }, [fadeAnim.current, slideAnim.current, duration]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim.current,
        transform: [{ translateY: slideAnim.current }],
        flex: 1,
      }}
    >
      {children}
    </Animated.View>
  );
};

export default ScreenAnimation;
