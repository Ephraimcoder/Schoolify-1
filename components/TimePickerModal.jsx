import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TimePickerModal = ({
  visible,
  onClose,
  onTimeSelected,
  initialTime = new Date(),
}) => {
  const [time, setTime] = useState(initialTime);
  const [showPicker, setShowPicker] = useState(Platform.OS === "ios");

  useEffect(() => {
    if (visible) {
      setTime(initialTime);
      if (Platform.OS === "android") {
        setShowPicker(true);
      }
    } else {
      setShowPicker(Platform.OS === "ios");
    }
  }, [visible, initialTime]);

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
      if (event.type === "dismissed") {
        onClose();
        return;
      }
    }

    if (selectedTime) {
      setTime(selectedTime);
      if (Platform.OS === "android") {
        onTimeSelected(selectedTime);
      }
    }
  };

  const handleConfirm = () => {
    onTimeSelected(time);
    onClose();
  };

  if (Platform.OS === "ios") {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose} style={styles.button}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity onPress={handleConfirm} style={styles.button}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={time}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
              style={styles.timePicker}
            />
          </View>
        </View>
      </Modal>
    );
  }

  // Android
  return (
    showPicker && (
      <DateTimePicker
        value={time}
        mode="time"
        display="default"
        onChange={handleTimeChange}
      />
    )
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "quicksandBold",
    color: "#111827",
  },
  button: {
    padding: 10,
  },
  cancelText: {
    color: "#6B7280",
    fontFamily: "quicksandSemiBold",
    fontSize: 16,
  },
  doneText: {
    color: "#4F46E5",
    fontFamily: "quicksandSemiBold",
    fontSize: 16,
  },
  timePicker: {
    height: 160,
  },
});

export default TimePickerModal;
