import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function CustomSplashScreen() {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/images/schoolify.png')} 
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBF5',
  },
  image: {
    width: '80%',
    height: '80%',
  },
});
