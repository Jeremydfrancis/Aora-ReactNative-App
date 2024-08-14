import React from "react";
import { Text, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function App() {
  return (
    <View style={styles.container}>
      <Text>I LOVE YOU BITCH</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(255, 0, 0)",
    alignItems: "center",
    justifyContent: "center",
  },
});
