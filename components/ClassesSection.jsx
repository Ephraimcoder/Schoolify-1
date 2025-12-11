import React, { useMemo } from "react";
import { View } from "react-native";
import ClassCard from "./ClassCard";

const dummyClasses = [
  {
    icon: "book-outline",
    title: "Data Structures",
    time: "10:00 - 11:00 AM",
    color: "#FFF4E5",
  },
  {
    icon: "laptop-outline",
    title: "Web Development",
    time: "11:00 - 12:00 PM",
    color: "#F3E8FF",
  },
  {
    icon: "calculator-outline",
    title: "Algorithms",
    time: "01:00 - 02:00 PM",
    color: "#E5F7FF",
  },
];

const ClassesSection = React.memo(() => {
  const classes = useMemo(() => dummyClasses, []);
  
  return (
    <View className="my-4">
      {classes.map((item, index) => (
        <ClassCard key={index} item={item} />
      ))}
    </View>
  );
});

ClassesSection.displayName = 'ClassesSection';

export default ClassesSection;
