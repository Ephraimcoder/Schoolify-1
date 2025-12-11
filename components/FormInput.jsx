import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TextInput, View } from 'react-native';

const FormInput = ({ 
  placeholder, 
  iconRight, 
  containerStyle, 
  value, 
  onChangeText, 
  ...rest 
}) => {
  return (
    <View style={containerStyle} className="flex-row items-center bg-white border border-gray-200 rounded-xl p-4 my-2">
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#A0A0A0"
        className='flex-1 text-base font-quicksand'
        value={value}
        onChangeText={onChangeText}
        {...rest}
      />
      {iconRight && <Ionicons name={iconRight.name} size={iconRight.size || 24} color={iconRight.color || 'gray'} />}
    </View>
  );
};

export default FormInput;
