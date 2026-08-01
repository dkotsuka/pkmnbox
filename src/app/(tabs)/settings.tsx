import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSaveSync } from "@/hooks/saveSyncContext";

export default function SettingsScreen() {
  const {
    snapshot,
    selectFolder,
    syncNow,
    clearFolderSelection,
    startAutoSync,
    stopAutoSync,
  } = useSaveSync();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Save Sync Settings</Text>

        <View style={styles.section}>
          <Text style={styles.label}>State: {snapshot.state}</Text>
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
          <Text style={styles.errorText}>
            {snapshot.errorMessage
              ? `Error: ${snapshot.errorMessage}`
              : "No errors"}
          </Text>
        </View>

        <View style={styles.section}>
          <Button title="Select Folder" onPress={() => void selectFolder()} />
        </View>
        <View style={styles.section}>
          <Button title="Sync Now" onPress={() => void syncNow()} />
        </View>
        <View style={styles.section}>
          <Button
            title="Start Auto Sync"
            onPress={() => void startAutoSync()}
          />
        </View>
        <View style={styles.section}>
          <Button title="Stop Auto Sync" onPress={stopAutoSync} />
        </View>
        <View style={styles.section}>
          <Button
            title="Clear Folder Selection"
            onPress={() => void clearFolderSelection()}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Detected .sav files</Text>
          {snapshot.saves.length === 0 ? (
            <Text style={styles.label}>No files found.</Text>
          ) : (
            snapshot.saves.map((saveFile) => (
              <View key={saveFile.uri} style={styles.fileRow}>
                <Text style={styles.fileName}>{saveFile.name}</Text>
                <Text style={styles.fileMeta}>URI: {saveFile.uri}</Text>
                <Text style={styles.fileMeta}>
                  Size: {saveFile.size ?? "unknown"}
                </Text>
                <Text style={styles.fileMeta}>
                  Modified:{" "}
                  {saveFile.modifiedAt
                    ? new Date(saveFile.modifiedAt).toLocaleString()
                    : "unknown"}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    color: "#b00020",
  },
  fileRow: {
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
  },
  fileMeta: {
    fontSize: 12,
    color: "#444444",
  },
});
