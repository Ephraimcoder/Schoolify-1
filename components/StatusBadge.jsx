import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStatusColor, getStatusIcon } from '../utils/taskStatus';

/**
 * StatusBadge - Displays task status with icon and color
 * @param {string} status - Task status ('todo', 'in_progress', 'completed')
 * @param {string} size - 'small' or 'medium'
 * @param {boolean} showLabel - Whether to show text label
 */
const StatusBadge = ({ 
  status, 
  size = 'small', 
  showLabel = false,
  style 
}) => {
  const color = getStatusColor(status);
  const iconName = getStatusIcon(status);
  const iconSize = size === 'small' ? 12 : 16;
  const fontSize = size === 'small' ? 10 : 12;
  
  return (
    <View style={[styles.badge, { backgroundColor: color }, style]}>
      <Ionicons name={iconName} size={iconSize} color="white" />
      {showLabel && (
        <Text style={[styles.label, { fontSize }]}>
          {status === 'todo' ? 'To Do' : 
           status === 'in_progress' ? 'In Progress' : 
           'Completed'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  label: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '600',
  },
});

export default StatusBadge;
