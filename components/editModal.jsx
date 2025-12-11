import React from "react";
import { Modal, Text, View } from "react-native";

export default function editModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide">
      <View>
        <Text>editModal</Text>
      </View>
    </Modal>
  );
}
