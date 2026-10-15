import { SERVICE_CENTER } from "@queenstown/shared";
import { StyleSheet, Text, View } from "react-native";

/** The first screen until the tabs arrive (Task 4). It shows that the shared package is wired in. */
export default function Home() {
  return (
    <View style={styles.container}>
      <Text>Queenstown Local</Text>
      <Text>{`${SERVICE_CENTER.latitude}, ${SERVICE_CENTER.longitude}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
});
