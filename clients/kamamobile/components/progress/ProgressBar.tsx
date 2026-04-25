import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: Props) {
  const percentage = (current / total) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.text}>
        {current} of {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bar: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  fill: {
    height: "100%",
    backgroundColor: "#0066cc",
  },
  text: {
    fontSize: 12,
    color: "#999",
  },
});
