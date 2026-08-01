import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSaveSync } from "@/hooks/saveSyncContext";

export default function HomeScreen() {
  const { snapshot } = useSaveSync();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Home</Text>
        <Text style={styles.label}>Sync state: {snapshot.state}</Text>
        <Text style={styles.label}>Strategy: {snapshot.strategy}</Text>
        <Text style={styles.label}>
          Selected folder: {snapshot.folderUri ?? "none"}
        </Text>
        <Text style={styles.label}>
          Detected saves: {snapshot.saves.length}
        </Text>
        <Text style={styles.label}>
          Last sync:{" "}
          {snapshot.lastSyncAt
            ? new Date(snapshot.lastSyncAt).toLocaleString()
            : "never"}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  label: {
    fontSize: 14,
  },
});
